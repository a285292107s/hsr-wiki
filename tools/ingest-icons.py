#!/usr/bin/env python3
"""图标入库转码器 —— 实现 [ADR 0057](../../docs/adr/0057-图片资源自持与WebP入库口径.md) 的入库契约。

用法：
    python tools/ingest-icons.py --category avatarcutinfigures --crop-alpha 4:5
    python tools/ingest-icons.py --category lightconemaxfigures --crop-alpha none
    python tools/ingest-icons.py --category avatarshopicon --only 1503 --sheet temp/sheet.jpg

为什么是「转码器」而不是 converter 的一步：`public/data/assets/**` 是**构建期一次性入库**的快照，
converter 不产出（ADR 0057 §7）。本脚本只做「读解包 PNG → 写 public/data/assets/icons/<分类>/<名>.webp」。

转码参数（ADR 0057 决策 2/4）——**必须逐字节可复现**：
    Image.open(src).convert('RGBA').save(dst, 'WEBP', quality=82, method=6)
    PicList 缺省 quality 是 100，只省 32% 而不是 83%，故 quality 必须显式给 82。
    `--crop-alpha` 是本脚本在转码**之前**追加的一步（见下），默认 none，即与上面的式子逐字节一致。

`--crop-alpha <w:h>`：按 alpha 包围盒裁掉透明边，并把裁剪窗口补齐到指定宽高比。
    适用对象是「立绘类」原图——它们在画布中央、四周大片透明（`avatarcutinfigures` 实测
    包围盒只占画布 50%~100% 宽 / 47%~100% 高，比例 0.68~1.34 各不相同），直接上版会得到
    「一张大画布中间一个小人」。裁到统一比例后同一分区的各条板才是**同一裁切比**（SKILL 的
    imagery 律：同一裁切比、同一处理）。`lightconemaxfigures` 的包围盒已等于整张画布
    （实测 100%×100%），故用 none。

    算法（可复现，无随机）：
      1. bb = im.getbbox()（alpha 非零包围盒）
      2. 目标比 T；若 (w/h) > T 则高补到 w/T，否则宽补到 h*T
      3. 再按 `--crop-pad`（缺省 0.02）等比放大窗口，避免主体贴边
      4. 窗口中心 = bb 中心，越界则平移回画布内（不缩小窗口），最终再夹到画布尺寸
      5. crop → q82/method=6

人眼核对（ADR 0057 决策 5）：`--sheet <路径>` 生成**深底大字联系表**——图标是纯白描边 + 透明底，
白底预览看不出内容，`naturalWidth > 0` 也证明不了有内容。
"""

from __future__ import annotations

import argparse
import io
import os
import sys
from concurrent.futures import ProcessPoolExecutor

try:
    from PIL import Image, ImageDraw
except ImportError:  # pragma: no cover - 环境缺失时给出可执行的指引
    sys.exit('需要 Pillow：python -m pip install Pillow')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST_ROOT = os.path.join(ROOT, 'public', 'data', 'assets', 'icons')
DEFAULT_SRC = r'C:\Users\28529\Desktop\StarRailTextures\assets\asbres\spriteoutput'
QUALITY = 82
METHOD = 6


def parse_aspect(text: str) -> tuple[int, int] | None:
    if text in ('none', 'off', ''):
        return None
    w, _, h = text.partition(':')
    return (int(w), int(h))


def crop_alpha(im: 'Image.Image', aspect: tuple[int, int], pad: float) -> 'Image.Image':
    bb = im.getbbox()
    if bb is None:
        return im
    W, H = im.size
    T = aspect[0] / aspect[1]
    x0, y0, x1, y1 = bb
    w, h = x1 - x0, y1 - y0
    if w / h > T:
        w2, h2 = w, round(w / T)
    else:
        w2, h2 = round(h * T), h
    w2, h2 = round(w2 * (1 + pad)), round(h2 * (1 + pad))
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    left = round(cx - w2 / 2)
    top = round(cy - h2 / 2)
    w2, h2 = min(w2, W), min(h2, H)
    left = max(0, min(left, W - w2))
    top = max(0, min(top, H - h2))
    return im.crop((left, top, left + w2, top + h2))


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
    # 返回**产物**名（.webp）：联系表按它去 dest 目录取图，返回源名（.png）会一张都取不到
    return os.path.basename(dest), len(buf.getvalue()), im.size[0]


def main() -> int:
    ap = argparse.ArgumentParser(description='图标入库转码（ADR 0057）')
    ap.add_argument('--src', default=DEFAULT_SRC, help='解包 spriteoutput 根目录')
    ap.add_argument('--category', required=True, help='分类目录名（= 入库目录名）')
    ap.add_argument('--crop-alpha', default='none', help='按 alpha 包围盒裁剪并补齐到该比例（如 4:5）；none = 不裁')
    ap.add_argument('--crop-pad', type=float, default=0.02, help='裁剪窗口留白比例（缺省 0.02）')
    ap.add_argument('--only', default='', help='只转这些文件（逗号分隔，不带扩展名）')
    ap.add_argument('--jobs', type=int, default=max(2, (os.cpu_count() or 4) - 2), help='并行进程数')
    ap.add_argument('--sheet', default='', help='生成深底大字联系表到该路径（人眼核对用）')
    ap.add_argument('--sheet-cols', type=int, default=6)
    ap.add_argument('--limit', type=int, default=0, help='只转前 N 个（冒烟用）')
    ap.add_argument('--sheet-only', action='store_true', help='不转码，只按已入库目录重建联系表（人眼核对）')
    args = ap.parse_args()

    if args.sheet_only:
        dest_dir = os.path.join(DEST_ROOT, args.category)
        if not os.path.isdir(dest_dir):
            sys.exit(f'入库目录不存在：{dest_dir}')
        names = sorted(
            (f for f in os.listdir(dest_dir) if f.endswith('.webp')),
            key=lambda f: -os.path.getsize(os.path.join(dest_dir, f)),
        )
        # 人眼核对要覆盖「最大的几张」与「随机若干」：只取最大几张会漏掉小文件转码失败
        picks = names[: max(args.sheet_cols * 2, 8)] + names[:: max(1, len(names) // max(args.sheet_cols, 1))][: args.sheet_cols]
        if not args.sheet:
            args.sheet = f'temp/sheet-{args.category}.jpg'
        make_sheet(dest_dir, list(dict.fromkeys(picks)), args.sheet, args.sheet_cols)
        return 0

    src_dir = os.path.join(args.src, args.category)
    if not os.path.isdir(src_dir):
        sys.exit(f'源目录不存在：{src_dir}')
    dest_dir = os.path.join(DEST_ROOT, args.category)
    aspect = parse_aspect(args.crop_alpha)

    names = sorted(f for f in os.listdir(src_dir) if f.lower().endswith('.png'))
    if args.only:
        want = {n.strip() for n in args.only.split(',') if n.strip()}
        names = [f for f in names if os.path.splitext(f)[0] in want]
    if args.limit:
        names = names[: args.limit]
    if not names:
        sys.exit('没有待转文件（检查 --only / 源目录）')

    jobs = [
        (os.path.join(src_dir, f), os.path.join(dest_dir, os.path.splitext(f)[0] + '.webp'), aspect, args.crop_pad)
        for f in names
    ]
    print(f'[ingest] {args.category}: {len(jobs)} 文件 → {os.path.relpath(dest_dir, ROOT)}  '
          f'(crop-alpha={args.crop_alpha}, jobs={args.jobs}, q{QUALITY}/method{METHOD})')

    done, total = 0, 0
    sizes: list[tuple[str, int]] = []
    with ProcessPoolExecutor(max_workers=args.jobs) as pool:
        for name, size, _w in pool.map(convert_one, jobs, chunksize=1):
            done += 1
            total += size
            sizes.append((name, size))
            if done % 25 == 0 or done == len(jobs):
                print(f'  {done}/{len(jobs)}  {total / 1024 / 1024:.1f} MB')

    sizes.sort(key=lambda kv: -kv[1])
    print(f'[ingest] 完成：{done} 文件 / {total / 1024 / 1024:.2f} MB '
          f'(均 {total / max(1, done) / 1024:.0f} KB；最大 {sizes[0][0]} {sizes[0][1] / 1024:.0f} KB)')

    if args.sheet:
        make_sheet(dest_dir, [n for n, _ in sizes], args.sheet, args.sheet_cols)
    return 0


def make_sheet(dest_dir: str, names: list[str], out: str, cols: int) -> None:
    """深底大字联系表：图标是纯白描边 + 透明底，白底预览看不出内容。"""
    picks = names[: max(cols * 3, 12)]
    cell = 220
    rows = (len(picks) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * cell, rows * (cell + 22)), (16, 16, 18))
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
