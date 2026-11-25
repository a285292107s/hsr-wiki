#!/usr/bin/env python3
"""图标入库转码器 —— 实现 ADR 0057 的入库契约，并按 ADR 0070 扩展为「按引用集同步」模式。

两种用法：

1) 按引用集补缺（ADR 0070 新增，推荐）
    python tools/ingest-icons.py --verify                    # 只做覆盖度核对（对齐 check-icon-coverage.mjs）
    python tools/ingest-icons.py --from-refs --dry-run       # 只打印待补清单
    python tools/ingest-icons.py --from-refs                 # 补站点实际引用但缺的（public/data/**）
    python tools/ingest-icons.py --from-refs --scope excel    # 放宽到解包 ExcelOutput 全量引用

2) 按分类全量转码（旧行为，保留）
    python tools/ingest-icons.py --category avatarcutinfigures --crop-alpha 4:5

映射真源：所有「SpriteOutput 相对路径 → 导出分类/本地相对路径」的换算只来自
`config/sprite-map.json`，本脚本与 `tools/check-icon-coverage.mjs`、`src/services/cdn/sprite-map.ts` 共读。

转码参数（ADR 0057 决策 2/4）——**必须逐字节可复现**：
    Image.open(src).convert('RGBA').save(dst, 'WEBP', quality=82, method=6)
"""

from __future__ import annotations

import argparse
import io
import json
import os
import re
import sys
from collections import Counter
from concurrent.futures import ProcessPoolExecutor

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover
    sys.exit('需要 Pillow：python -m pip install Pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_ROOT = os.path.join(ROOT, 'public', 'data', 'assets', 'icons')
SITE_DATA = os.path.join(ROOT, 'public', 'data')
EXCEL_DATA = os.path.join(ROOT, 'vendor', 'TurnBasedGameData', 'ExcelOutput')
SPRITE_MAP_FILE = os.path.join(ROOT, 'config', 'sprite-map.json')

TEXTURES_ROOT_CANDIDATES = [
    os.environ.get('HSR_TEXTURES_ROOT', ''),
    r'C:\Users\28529\Desktop\StarRailTextures',
]
QUALITY = 82
METHOD = 6
REF_RE = re.compile(r'"SpriteOutput/([^"]+)"')
PROFESSION_MAP = {'priest': 'Pirest', 'elation': 'Joy'}
PROFESSION_MAP_REV = {v: k for k, v in PROFESSION_MAP.items()}


# ---------------------------------------------------------------- 配置与索引

def load_sprite_map() -> dict:
    with open(SPRITE_MAP_FILE, 'r', encoding='utf-8') as fh:
        return json.load(fh)


def resolve_source_root(sprite_map: dict) -> str:
    """按 sourceRootCandidates 探测真实解包根（治「源目录不存在」的静默失败）。"""
    tried = []
    for base in TEXTURES_ROOT_CANDIDATES:
        if not base:
            continue
        for rel in sprite_map.get('sourceRootCandidates', []):
            cand = os.path.join(base, rel.replace('/', os.sep))
            tried.append(cand)
            if os.path.isdir(cand):
                return cand
    sys.exit('解包 spriteoutput 根目录不存在。已尝试：\n  ' + '\n  '.join(tried)
             + '\n请设置 HSR_TEXTURES_ROOT 或用 --src 指定。')


def build_disk_index(src_root: str) -> dict[str, str]:
    """小写相对路径（含扩展名）→ 真实相对路径。"""
    idx: dict[str, str] = {}
    for cur, _dirs, files in os.walk(src_root):
        for name in files:
            rel = os.path.relpath(os.path.join(cur, name), src_root).replace(os.sep, '/')
            idx[rel.lower()] = rel
    return idx


def build_leaf_index(src_root: str, prefix: str) -> dict[str, str]:
    """在 prefix 下建「文件名(不含扩展名，小写) → 相对路径」索引（用于压平类分类）。"""
    idx: dict[str, str] = {}
    base = os.path.join(src_root, prefix.replace('/', os.sep)) if prefix else src_root
    if not os.path.isdir(base):
        return idx
    for cur, _dirs, files in os.walk(base):
        for name in files:
            stem = os.path.splitext(name)[0]
            rel = os.path.relpath(os.path.join(cur, name), src_root).replace(os.sep, '/')
            idx.setdefault(stem.lower(), rel)
    return idx


def build_export_index() -> dict[str, set[str]]:
    """分类 → 已入库相对路径集合（不含扩展名，正斜杠，保留大小写）。"""
    out: dict[str, set[str]] = {}
    if not os.path.isdir(ICONS_ROOT):
        return out
    for cat in os.listdir(ICONS_ROOT):
        cdir = os.path.join(ICONS_ROOT, cat)
        if not os.path.isdir(cdir):
            continue
        cur_set: set[str] = set()
        for cur, _dirs, files in os.walk(cdir):
            for name in files:
                stem = os.path.splitext(name)[0]
                cur_set.add(os.path.relpath(os.path.join(cur, stem), cdir).replace(os.sep, '/'))
        out[cat] = cur_set
    return out


# ---------------------------------------------------------------- 路由

def _match_route(route: dict, segs_lower: list[str]) -> bool:
    """判断 ref 的相对路径（小写分段，不含扩展名）是否命中一条路由。"""
    if segs_lower[0] != route['first']:
        return False
    sub = route.get('sub')
    if not sub:
        return True
    sub_segs = sub.lower().split('/')
    return segs_lower[1:1 + len(sub_segs)] == sub_segs


def _local_rel(route: dict, segs: list[str], leaf: str) -> str:
    """按 local 模式产出导出分类内的相对路径（不含扩展名）。segs 保留原始大小写。"""
    mode = route.get('local', 'leaf')
    if mode == 'leaf':
        return leaf
    if mode == 'leafLower':
        return leaf.lower()
    if mode == 'afterFirstLower':
        return '/'.join([s.lower() for s in segs[1:-1]] + [leaf])
    if mode == 'afterFirst':
        return '/'.join(segs[1:])
    if mode == 'afterSub':
        sub_n = len(route['sub'].split('/'))
        return '/'.join(segs[1 + sub_n:])
    if mode == 'fullExact':
        return '/'.join(segs)
    if mode == 'lowerDirs':
        # 目录段全小写、文件名保留原大小写（与 sprite-map.json 的 localModes 声明及 TS/Node 实现一致）
        return '/'.join([s.lower() for s in segs[:-1]] + [leaf])
    if mode == 'element':
        return leaf.replace('IconDamageType', '')[:1].lower() + leaf.replace('IconDamageType', '')[1:]
    if mode == 'pathicon':
        k = leaf.replace('IconProfession', '').replace('Middle', '')
        return PROFESSION_MAP_REV.get(k, k).lower()
    return leaf


def _sprite_rel_for_local(route: dict, category: str, local_rel: str, sprite_map: dict) -> str:
    """反向：导出相对路径（不含扩展名）→ 解包侧首选相对路径（不含扩展名），用于定位源 png。

    关键：leaf 模式必须优先用「路由命中的 sub”，而不是分类的 sourceDir。
    例：gridfight/traiticon/miniicon 与 gridfight/traiticon/icon 共用 gridfight-icon 分类，
    但 sourceDir 只写了前者；若用 sourceDir 去拼 miniicon 的图会永远找不到。
    """
    mode = route.get('local', 'leaf')
    if mode in ('leaf', 'leafLower'):
        first = route.get('first', '')
        sub = route.get('sub')
        if sub:
            return f'{first}/{sub}/{local_rel}'
        src_dir = sprite_map['categories'].get(category, {}).get('sourceDir', '')
        return f'{src_dir}/{local_rel}' if src_dir else local_rel
    if mode in ('afterFirst', 'afterFirstLower'):
        return f'{route["first"]}/{local_rel}'
    if mode == 'afterSub':
        sub = route['sub']
        return f'{route["first"]}/{sub}/{local_rel}'
    if mode == 'fullExact':
        return local_rel
    if mode == 'lowerDirs':
        return local_rel
    if mode == 'element':
        return f'icondamagetype/IconDamageType{local_rel[:1].upper()}{local_rel[1:].lower()}'
    if mode == 'pathicon':
        mapped = PROFESSION_MAP.get(local_rel.lower(), local_rel[:1].upper() + local_rel[1:])
        return f'professioniconmiddle/IconProfession{mapped}Middle'
    return local_rel


def route_ref(sprite_map: dict, segs: list[str]) -> list[tuple[str, str, dict]]:
    """返回 [(category, local_rel, 实际命中的 route), ...]；未命中则走 fallback。

    必须回传 route 本体：同一分类可能被多条带 sub 的路由共同产出
    （如 gridfight-icon 同时由 traiticon/icon 与 traiticon/miniicon），
    只回传 category 会让下游反推源路径时总是取到第一条路由。
    """
    segs_lower = [s.lower() for s in segs]
    leaf = segs[-1]
    for route in sprite_map.get('routes', []):
        if not _match_route(route, segs_lower):
            continue
        cats = route.get('categories') or [route['category']]
        return [(cat, _local_rel(route, segs, leaf), route) for cat in cats]
    fb = sprite_map['fallback']
    return [(fb['category'], _local_rel(fb, segs, leaf), fb)]


# ---------------------------------------------------------------- 引用扫描

def scan_refs(scope: str) -> list[list[str]]:
    """返回 [[seg0, seg1, ..., 文件名(不含扩展名)], ...]（去重，保留原始大小写）。"""
    root = EXCEL_DATA if scope == 'excel' else SITE_DATA
    seen: set[str] = set()
    out: list[list[str]] = []
    for cur, _dirs, files in os.walk(root):
        for name in files:
            if not name.endswith('.json'):
                continue
            try:
                with open(os.path.join(cur, name), 'r', encoding='utf-8', errors='ignore') as fh:
                    text = fh.read()
            except OSError:
                continue
            for m in REF_RE.finditer(text):
                raw = m.group(1)
                segs = raw.split('/')
                if len(segs) < 2:
                    continue
                segs[-1] = os.path.splitext(segs[-1])[0]  # 剥离扩展名
                key = '/'.join(s.lower() for s in segs)
                if key in seen:
                    continue
                seen.add(key)
                out.append(segs)
    return out


# ---------------------------------------------------------------- 转码

def convert_one(job: tuple[str, str, tuple[int, int] | None, float]) -> tuple[str, int, int]:
    src, dest, aspect, pad = job
    im = Image.open(src).convert('RGBA')
    if aspect is not None:
        im = crop_alpha(im, aspect, pad)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=QUALITY, method=METHOD)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'wb') as fh:
        fh.write(buf.getvalue())
    return os.path.basename(dest), len(buf.getvalue()), im.size[0]


def crop_alpha(im: 'Image.Image', aspect: tuple[int, int], pad: float) -> 'Image.Image':
    bb = im.getbbox()
    if bb is None:
        return im
    W, H = im.size
    T = aspect[0] / aspect[1]
    x0, y0, x1, y1 = bb
    w, h = x1 - x0, y1 - y0
    w2, h2 = (w, round(w / T)) if w / h > T else (round(h * T), h)
    w2, h2 = round(w2 * (1 + pad)), round(h2 * (1 + pad))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left, top = round(cx - w2 / 2), round(cy - h2 / 2)
    w2, h2 = min(w2, W), min(h2, H)
    left, top = max(0, min(left, W - w2)), max(0, min(top, H - h2))
    return im.crop((left, top, left + w2, top + h2))


def parse_aspect(text: str) -> tuple[int, int] | None:
    if text in ('none', 'off', ''):
        return None
    w, _, h = text.partition(':')
    return (int(w), int(h))


# ---------------------------------------------------------------- 计划与核对

def plan_from_refs(sprite_map: dict, src_root: str, scope: str) -> tuple[list[dict], list[dict], list[dict]]:
    """返回 (可补导出计划, 无源清单, 设计上走 CDN 的清单)。
    跳过已入库 / ignoreLocal / knownDeadRefs。cdnBacked 分类不进「可补」，只单列。"""
    disk = build_disk_index(src_root)
    exported = build_export_index()
    # 全局叶名索引（判断「同叶名在别的分类已导出」）
    global_stems: set[str] = set()
    for s in exported.values():
        for rel in s:
            global_stems.add(rel.split('/')[-1].lower())
    # 压平类分类需要 leaf 索引
    leaf_idx: dict[str, dict[str, str]] = {}
    for cat, spec in sprite_map['categories'].items():
        if spec.get('sourceDir') and cat in ('skillicons',):
            leaf_idx[cat] = build_leaf_index(src_root, spec['sourceDir'])
    dead = [re.compile(p) for p in sprite_map.get('knownDeadRefs', {}).get('patterns', [])]

    plan: list[dict] = []
    unsourced: list[dict] = []
    cdn_backed: list[dict] = []
    for segs in scan_refs(scope):
        for cat, local_rel, route in route_ref(sprite_map, segs):
            spec = sprite_map['categories'].get(cat, {})
            local_key = local_rel
            if local_key in exported.get(cat, set()):
                break
            if local_key in set(spec.get('ignoreLocal', [])):
                break
            if any(r.search(f'{cat}/{local_key}') for r in dead):
                break
            # 定位源 png（用实际命中的 route，不能用「分类的第一条路由」）
            if cat in leaf_idx:
                actual = leaf_idx[cat].get(local_rel.split('/')[-1].lower())
            else:
                sprite_rel = _sprite_rel_for_local(route, cat, local_rel, sprite_map)
                actual = disk.get((sprite_rel + '.png').lower())
            # 设计上走 CDN 的分类：不缺、只单列
            if spec.get('cdnBacked'):
                cdn_backed.append({'category': cat, 'local_rel': local_rel})
                break
            # 同叶名已在别的分类导出：可借，不重复落盘
            if local_rel.split('/')[-1].lower() in global_stems:
                break
            if actual is None:
                unsourced.append({'category': cat, 'local_rel': local_rel, 'reason': 'unsourced'})
                break
            plan.append({
                'category': cat,
                'local_rel': local_rel,
                'src_path': os.path.join(src_root, actual.replace('/', os.sep)),
                'dest_path': os.path.join(ICONS_ROOT, cat, (local_rel + '.webp').replace('/', os.sep)),
                'reason': 'missing',
            })
            break
    return plan, unsourced, cdn_backed


def verify(sprite_map: dict, src_root: str, scope: str) -> int:
    plan, unsourced, cdn_backed = plan_from_refs(sprite_map, src_root, scope)
    print(f'[verify] scope={scope}')
    print(f'  缺失（解包盘有源，可补导出）: {len(plan)}')
    for cat, n in Counter(p['category'] for p in plan).most_common():
        print(f'      {cat:<24} {n}')
    print(f'  无源（解包盘/上游都没有，需远端兜底）: {len(unsourced)}')
    for cat, n in Counter(p['category'] for p in unsourced).most_common():
        print(f'      {cat:<24} {n}')
    print(f'  设计上走 CDN（不计缺）: {len(cdn_backed)}')
    for cat, n in Counter(p['category'] for p in cdn_backed).most_common():
        print(f'      {cat:<24} {n}')
    return 0


# ---------------------------------------------------------------- 主流程

def main() -> int:
    ap = argparse.ArgumentParser(description='图标入库转码（ADR 0057 / 0070）')
    ap.add_argument('--category', help='按分类全量转码（旧行为）')
    ap.add_argument('--from-refs', action='store_true', help='按引用集补缺')
    ap.add_argument('--scope', choices=['site', 'excel'], default='site', help='引用集来源')
    ap.add_argument('--verify', action='store_true', help='只做覆盖度核对')
    ap.add_argument('--dry-run', action='store_true', help='只打印待转清单')
    ap.add_argument('--src', default='', help='解包 spriteoutput 根目录')
    ap.add_argument('--crop-alpha', default='none', help='按 alpha 裁到该比例（如 4:5）')
    ap.add_argument('--crop-pad', type=float, default=0.02)
    ap.add_argument('--only', default='', help='只转这些文件（逗号分隔，不带扩展名）')
    ap.add_argument('--jobs', type=int, default=max(2, (os.cpu_count() or 4) - 2))
    ap.add_argument('--sheet', default='')
    ap.add_argument('--sheet-cols', type=int, default=6)
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--sheet-only', action='store_true')
    args = ap.parse_args()

    try:
        sprite_map = load_sprite_map()
    except OSError as exc:
        sys.exit(f'读取映射真源失败：{exc}')

    if args.sheet_only:
        dest_dir = os.path.join(ICONS_ROOT, args.category)
        if not os.path.isdir(dest_dir):
            sys.exit(f'入库目录不存在：{dest_dir}')
        names = sorted((f for f in os.listdir(dest_dir) if f.endswith('.webp')),
                       key=lambda f: -os.path.getsize(os.path.join(dest_dir, f)))
        make_sheet(dest_dir, names[: max(args.sheet_cols * 2, 8)],
                   args.sheet or f'temp/sheet-{args.category}.jpg', args.sheet_cols)
        return 0

    src_root = args.src or resolve_source_root(sprite_map)

    if args.verify:
        return verify(sprite_map, src_root, args.scope)

    if args.from_refs:
        plan, unsourced, cdn_backed = plan_from_refs(sprite_map, src_root, args.scope)
        if args.limit:
            plan = plan[: args.limit]
        if not plan:
            print('[ingest] 引用集已全覆盖，无待补文件')
            return 0
        print(f'[ingest] --from-refs scope={args.scope}：{len(plan)} 个待补文件'
              f'（另有 {len(unsourced)} 个无源、{len(cdn_backed)} 个设计上走 CDN）')
        if args.dry_run:
            for cat, n in Counter(p['category'] for p in plan).most_common():
                print(f'    {cat:<24} {n}')
            for p in plan[:20]:
                print(f'      [{p["category"]}] {p["local_rel"]}.webp')
            return 0
        aspect = parse_aspect(args.crop_alpha)
        jobs = [(p['src_path'], p['dest_path'], aspect, args.crop_pad) for p in plan]
        sizes = _run_jobs(jobs, args.jobs)
        if args.sheet:
            make_sheet(ICONS_ROOT, [n for n, _ in sizes], args.sheet, args.sheet_cols)
        return 0

    # ---------------- 旧行为：按分类全量 ----------------
    if not args.category:
        sys.exit('需要 --category 或 --from-refs 或 --verify')
    spec = sprite_map['categories'].get(args.category)
    if spec is None:
        sys.exit(f'sprite-map.json 未登记分类：{args.category}')
    src_dir = os.path.join(src_root, spec.get('sourceDir', '').replace('/', os.sep))
    if not os.path.isdir(src_dir):
        sys.exit(f'源目录不存在：{src_dir}')
    dest_dir = os.path.join(ICONS_ROOT, args.category)
    aspect = parse_aspect(args.crop_alpha)
    names = sorted(f for f in os.listdir(src_dir) if f.lower().endswith('.png'))
    if args.only:
        want = {n.strip() for n in args.only.split(',') if n.strip()}
        names = [f for f in names if os.path.splitext(f)[0] in want]
    if args.limit:
        names = names[: args.limit]
    if not names:
        sys.exit('没有待转文件（检查 --only / 源目录）')
    jobs = [(os.path.join(src_dir, f), os.path.join(dest_dir, os.path.splitext(f)[0] + '.webp'), aspect, args.crop_pad)
            for f in names]
    print(f'[ingest] {args.category}: {len(jobs)} 文件 → {os.path.relpath(dest_dir, ROOT)}')
    sizes = _run_jobs(jobs, args.jobs)
    if args.sheet:
        make_sheet(dest_dir, [n for n, _ in sizes], args.sheet, args.sheet_cols)
    return 0


def _run_jobs(jobs, nproc: int) -> list[tuple[str, int]]:
    done, total = 0, 0
    sizes: list[tuple[str, int]] = []
    with ProcessPoolExecutor(max_workers=nproc) as pool:
        for name, size, _w in pool.map(convert_one, jobs, chunksize=1):
            done += 1
            total += size
            sizes.append((name, size))
            if done % 25 == 0 or done == len(jobs):
                print(f'  {done}/{len(jobs)}  {total / 1024 / 1024:.1f} MB')
    print(f'[ingest] 完成：{done} 文件 / {total / 1024 / 1024:.2f} MB')
    return sorted(sizes, key=lambda x: -x[1])

def make_sheet(dest_dir: str, names: list[str], out: str, cols: int) -> None:
    picks = names[: max(cols * 3, 12)]
    cell = 220
    rows = (len(picks) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, max(1, rows) * (cell + 22)), (16, 16, 18))
    draw = ImageDraw.Draw(sheet)
    for i, name in enumerate(picks):
        path = os.path.join(dest_dir, name)
        if not os.path.exists(path):
            continue
        im = Image.open(path).convert('RGBA')
        im.thumbnail((cell - 16, cell - 16))
        x = (i % cols) * cell + (cell - im.width) // 2
        y = (i // cols) * (cell + 22) + (cell - im.height) // 2
        sheet.paste(im, (x, y), im)
        draw.text(((i % cols) * cell + 6, (i // cols) * (cell + 22) + cell + 4), name[:26], fill=(200, 200, 200))
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    sheet.save(out, quality=88)
    print(f'[ingest] 联系表：{out}（{len(picks)} 张，深底）')


if __name__ == '__main__':
    raise SystemExit(main())
