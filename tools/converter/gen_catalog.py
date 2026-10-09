"""生成 ExcelOutput 数据目录索引（DATA_CATALOG.md 总索引 + DATA_CATALOG.parts/ 分片）。

扫描 vendor/TurnBasedGameData/ExcelOutput/ 下所有 JSON 文件，
提取每个文件的：记录数、字段列表（schema）、文件大小、首条记录摘要。

**分片机制（体量红线，见 AGENTS.md「强制规则」）**：全量索引约 25–30 万 token，
超出任何模型的上下文预算，禁止以单文件形式交付。故全量模式输出：
- `DATA_CATALOG.md`：总索引（分片表 + TextMap 清单 + 定位流程），保持 KB 级；
- `DATA_CATALOG.parts/<分片>.md`：按文件名首字母切分的字段明细，单片控制在 ~150 KB 内。
定位流程：`query.py --list <关键词>` 列出文件名 → 按首字母打开对应分片；
或直接 `query.py <文件名> --schema` 取单表字段全集（零文档读取）。

用法:
    cd tools/converter
    python gen_catalog.py              # 全量索引 → DATA_CATALOG.md + DATA_CATALOG.parts/*.md
    python gen_catalog.py --top 50     # 局部索引前 50 个最大文件 → DATA_CATALOG.top50.md（勿提交）
    python gen_catalog.py --filter Avatar  # 局部索引文件名含 Avatar 的 → DATA_CATALOG.filter-avatar.md（勿提交）
"""

import argparse
import json
import sys
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import EXCEL_DIR, TEXTMAP_DIR

OUTPUT_FILE = Path(__file__).resolve().parent / "DATA_CATALOG.md"
PARTS_DIR = OUTPUT_FILE.parent / "DATA_CATALOG.parts"

# 分片方案：按文件名首字母聚簇。小字母合并、大字母独立，单片不超过约 150 KB（≈5 万 token）。
# 未覆盖的字母（当前数据没有，未来上游新增）按实际出现的字母自动成片，命名沿用区间写法。
SHARDS: list[tuple[str, frozenset[str]]] = [
    ("a", frozenset("A")),
    ("b-d", frozenset("BCD")),
    ("e-h", frozenset("EFGH")),
    ("i-l", frozenset("IL")),
    ("m", frozenset("M")),
    ("n-q", frozenset("NOPQ")),
    ("r", frozenset("R")),
    ("s-t", frozenset("ST")),
    ("u-w", frozenset("UVW")),
]


def get_file_size_mb(path: Path) -> float:
    return path.stat().st_size / (1024 * 1024)


def inspect_json_file(path: Path) -> dict:
    """检查单个 JSON 文件，返回元信息。"""
    size_mb = get_file_size_mb(path)

    try:
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, UnicodeDecodeError) as e:
        return {"name": path.name, "size_mb": size_mb, "error": str(e)}

    info: dict = {
        "name": path.name,
        "size_mb": size_mb,
    }

    if isinstance(data, list):
        info["type"] = "array"
        info["count"] = len(data)
        if data and isinstance(data[0], dict):
            fields: set[str] = set()
            for rec in data:
                if isinstance(rec, dict):
                    fields |= set(rec.keys())
            info["fields"] = sorted(fields)
            info["sample"] = truncate_record(data[0])
    elif isinstance(data, dict):
        info["type"] = "object"
        info["count"] = len(data)
        sample_keys = list(data.keys())[:3]
        info["sample_keys"] = sample_keys
        if sample_keys:
            first_val = data[sample_keys[0]]
            if isinstance(first_val, dict):
                fields = set()
                for v in data.values():
                    if isinstance(v, dict):
                        fields |= set(v.keys())
                info["fields"] = sorted(fields)
    else:
        info["type"] = type(data).__name__

    return info


def truncate_record(record: dict, max_str_len: int = 40) -> dict:
    """截断记录中的长字段，用于样例展示。

    长字符串加省略号；长列表/字典改为结构化摘要（如 "<list[123]>"），
    保证样例输出始终是合法 JSON（此前直接截断 JSON 文本会产生非法片段）。
    """
    result = {}
    for k, v in record.items():
        if isinstance(v, str) and len(v) > max_str_len:
            result[k] = v[:max_str_len] + "..."
        elif isinstance(v, (list, dict)):
            s = json.dumps(v, ensure_ascii=False)
            if len(s) > max_str_len:
                result[k] = f"<{type(v).__name__}[{len(v)}]>"
            else:
                result[k] = v
        else:
            result[k] = v
    return result


def shard_of(name: str) -> str:
    """文件名 → 分片 id（按首字母）。未覆盖字母动态成片（`x-z` 区间写法）。"""
    letter = name[:1].upper()
    for shard_id, letters in SHARDS:
        if letter in letters:
            return shard_id
    return letter.lower()


def format_entry(e: dict) -> list[str]:
    """单个文件小节（分片与局部索引共用）。"""
    lines: list[str] = []
    if "error" in e:
        lines.append(f"### {e['name']} ({e['size_mb']:.2f} MB) ⚠️ 解析失败")
        lines.append(f"错误: {e['error']}")
        lines.append("")
        return lines

    count_str = f"{e.get('count', '?'):,}" if isinstance(e.get("count"), int) else "?"
    lines.append(f"### {e['name']} ({e['size_mb']:.2f} MB, {count_str} 条)")
    lines.append("")

    if "fields" in e:
        fields = e["fields"]
        lines.append(f"**字段** ({len(fields)}): `{', '.join(fields)}`")
        lines.append("")

    if "sample" in e:
        lines.append("**首条记录摘要**:")
        lines.append("```json")
        lines.append(json.dumps(e["sample"], ensure_ascii=False, indent=2))
        lines.append("```")
        lines.append("")

    if "sample_keys" in e:
        lines.append(f"**字典键样例**: {e['sample_keys']}")
        lines.append("")

    return lines


def format_shard(shard_id: str, letters: str, entries: list[dict]) -> str:
    """生成单个分片的 Markdown（自带返回总索引的链接）。"""
    lines = [
        f"# DATA_CATALOG 分片：文件名首字母 {letters}",
        "",
        f"> 本文件由 `gen_catalog.py` 自动生成，是 [DATA_CATALOG.md](../DATA_CATALOG.md) 总索引的分片 {shard_id}（共 {len(entries)} 个文件）。",
        "> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。",
        "> 只需要某一两张表时，优先 `python query.py <文件名> --schema`，不必读本分片。",
        "",
    ]
    entries_sorted = sorted(entries, key=lambda x: x["size_mb"], reverse=True)
    for e in entries_sorted:
        lines += format_entry(e)
    return "\n".join(lines)


def format_master(shards: list[tuple[str, str, list[dict]]], textmap_info: list[dict]) -> str:
    """生成总索引 Markdown（KB 级：TextMap 清单 + 分片表 + 定位流程）。"""
    entries = [e for _, _, group in shards for e in group]
    errors = [e for e in entries if "error" in e]
    total_mb = sum(e["size_mb"] for e in entries)
    lines = [
        "# ExcelOutput 数据目录索引（总索引）",
        "",
        "> 本文件由 `gen_catalog.py` 自动生成，描述 `vendor/TurnBasedGameData/ExcelOutput/` 下所有 JSON 文件的结构。",
        "> **禁止整本通读**：全量字段明细按文件名首字母分片存放于 [DATA_CATALOG.parts/](DATA_CATALOG.parts/)，单片控制在约 150 KB 内。",
        "",
        "**定位流程（三选一，优先前者）**：",
        "",
        "1. `python query.py --list <关键词>` 按文件名模糊列出候选（零文档读取）；",
        "2. `python query.py <文件名> --schema` 直接取单表字段全集与记录数；",
        "3. 需要浏览整簇表结构时，按首字母打开下方对应分片。",
        "",
        f"**文件总数**: {len(entries)}",
        f"**总大小**: {total_mb:.1f} MB",
        f"**解析失败**: {len(errors)}",
        "",
        "## TextMap",
        "",
        "| 文件 | 大小 | 条目数 |",
        "|------|------|--------|",
    ]

    for tm in textmap_info:
        count = tm.get("count", "?")
        count_str = f"{count:,}" if isinstance(count, int) else str(count)
        lines.append(f"| {tm['name']} | {tm['size_mb']:.1f} MB | {count_str} |")

    lines += [
        "",
        "## 分片索引（按文件名首字母，片内按文件大小降序）",
        "",
        "| 分片 | 首字母 | 文件数 | 总大小 |",
        "| --- | --- | --- | --- |",
    ]

    for shard_id, letters, group in shards:
        group_mb = sum(e["size_mb"] for e in group)
        lines.append(
            f"| [{shard_id}](DATA_CATALOG.parts/{shard_id}.md) | {letters} | {len(group)} | {group_mb:.1f} MB |"
        )

    lines.append("")
    return "\n".join(lines)


def format_catalog(entries: list[dict], textmap_info: dict) -> str:
    """生成 Markdown 格式的目录索引（局部索引模式，单文件）。"""
    errors = [e for e in entries if "error" in e]
    lines = [
        "# ExcelOutput 数据目录索引",
        "",
        "> 本文件由 `gen_catalog.py` 自动生成，描述 `vendor/TurnBasedGameData/ExcelOutput/` 下所有 JSON 文件的结构。",
        "> AI 可通过本索引快速定位目标数据文件，再用 `query.py` 精确查询具体记录。",
        "> `fields` 为全部记录字段的并集（官方数据中可选字段可能仅出现在部分记录）。",
        "",
        f"**文件总数**: {len(entries)}",
        f"**总大小**: {sum(e['size_mb'] for e in entries):.1f} MB",
        f"**解析失败**: {len(errors)}",
        "",
        "## TextMap",
        "",
        f"| 文件 | 大小 | 条目数 |",
        f"|------|------|--------|",
    ]

    for tm in textmap_info:
        count = tm.get('count', '?')
        count_str = f"{count:,}" if isinstance(count, int) else str(count)
        lines.append(f"| {tm['name']} | {tm['size_mb']:.1f} MB | {count_str} |")

    lines += [
        "",
        "## ExcelOutput 文件列表",
        "",
        "按文件大小降序排列。`fields` 为全部记录的字段并集。",
        "",
    ]

    entries_sorted = sorted(entries, key=lambda x: x["size_mb"], reverse=True)

    for e in entries_sorted:
        lines += format_entry(e)

    return "\n".join(lines)


def inspect_textmap() -> list[dict]:
    """检查 TextMap 目录下的文件。"""
    results = []
    if not TEXTMAP_DIR.exists():
        return results
    for f in sorted(TEXTMAP_DIR.iterdir()):
        if f.suffix != ".json":
            continue
        size_mb = get_file_size_mb(f)
        info = {"name": f.name, "size_mb": size_mb}
        if "CHS" in f.name:
            try:
                with open(f, encoding="utf-8") as fp:
                    data = json.load(fp)
                info["count"] = len(data)
            except Exception:
                info["count"] = "?"
        else:
            info["count"] = "跳过"
        results.append(info)
    return results


def group_by_shard(entries: list[dict]) -> list[tuple[str, str, list[dict]]]:
    """把条目按分片 id 聚簇，返回 (分片 id, 字母区间, 条目) 列表，按首字母排序。"""
    groups: dict[str, list[dict]] = {}
    for e in entries:
        groups.setdefault(shard_of(e["name"]), []).append(e)

    def letters_of(shard_id: str) -> str:
        for sid, letters in SHARDS:
            if sid == shard_id:
                return "".join(sorted(letters))
        # 动态分片：字母区间由实际出现的首字母构成（单字母即该字母）
        present = sorted({e["name"][:1].upper() for e in groups[shard_id]})
        if len(present) == 1:
            return present[0]
        return f"{present[0]}-{present[-1]}"

    shards = [(sid, letters_of(sid), groups[sid]) for sid in groups]
    shards.sort(key=lambda s: s[1][0])
    return shards


def main():
    parser = argparse.ArgumentParser(description="生成 ExcelOutput 数据目录索引")
    parser.add_argument("--top", type=int, default=0, help="仅索引前 N 个最大文件（0=全部）")
    parser.add_argument("--filter", type=str, default="", help="仅索引文件名含指定关键词的")
    args = parser.parse_args()

    if not EXCEL_DIR.exists():
        print(f"错误: 源目录不存在 {EXCEL_DIR}")
        print("请确保 git submodule 已初始化: git submodule update --init")
        sys.exit(1)

    print(f"扫描 {EXCEL_DIR} ...")
    files = sorted(EXCEL_DIR.glob("*.json"))

    if args.filter:
        files = [f for f in files if args.filter.lower() in f.name.lower()]
        print(f"过滤后: {len(files)} 个文件含 '{args.filter}'")

    if args.top > 0:
        files = sorted(files, key=lambda p: p.stat().st_size, reverse=True)[:args.top]

    print(f"共 {len(files)} 个文件待索引")

    entries = []
    for i, f in enumerate(files, 1):
        if i % 100 == 0:
            print(f"  进度: {i}/{len(files)}")
        entries.append(inspect_json_file(f))

    print("检查 TextMap ...")
    textmap_info = inspect_textmap()

    suffix = []
    if args.filter:
        suffix.append(f"filter-{args.filter.lower()}")
    if args.top > 0:
        suffix.append(f"top{args.top}")
    output_file = (
        OUTPUT_FILE.with_name(f"DATA_CATALOG.{'-'.join(suffix)}.md") if suffix else OUTPUT_FILE
    )

    if suffix:
        # 局部索引（--top / --filter）：单文件、体量可控，保持旧行为，勿提交
        print("生成索引 ...")
        catalog = format_catalog(entries, textmap_info)
        # newline="\n"：Windows 上禁用 \n→CRLF 翻译（全仓锁定 LF，见 .gitattributes）
        output_file.write_text(catalog, encoding="utf-8", newline="\n")
        print(f"✅ 已生成 {output_file} ({len(catalog) / 1024:.0f} KB)")
        print(f"⚠️ 局部索引（{len(entries)} 个文件），请勿提交到版本控制")
        return

    # 全量模式：总索引 + 首字母分片（清掉过期分片，避免动态字母残留孤儿文件）
    print("生成总索引与分片 ...")
    shards = group_by_shard(entries)
    PARTS_DIR.mkdir(exist_ok=True)
    for stale in PARTS_DIR.glob("*.md"):
        stale.unlink()

    master = format_master(shards, textmap_info)
    OUTPUT_FILE.write_text(master, encoding="utf-8", newline="\n")
    print(f"✅ 已生成 {OUTPUT_FILE} ({len(master) / 1024:.1f} KB)")

    for shard_id, letters, group in shards:
        shard_path = PARTS_DIR / f"{shard_id}.md"
        content = format_shard(shard_id, letters, group)
        shard_path.write_text(content, encoding="utf-8", newline="\n")
        print(f"✅ 已生成 {shard_path.name}（{letters}，{len(group)} 文件，{len(content) / 1024:.1f} KB）")

    total_kb = sum(e["size_mb"] for e in entries)
    print(f"共 {len(shards)} 个分片，总源规模 {total_kb:.1f} MB")


if __name__ == "__main__":
    main()
