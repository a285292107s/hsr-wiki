"""生成 ExcelOutput 数据目录索引（DATA_CATALOG.md）。

扫描 vendor/TurnBasedGameData/ExcelOutput/ 下所有 JSON 文件，
提取每个文件的：记录数、字段列表（schema）、文件大小、首条记录摘要。
输出轻量级 Markdown 索引，供 AI 快速了解数据结构而无需读取原始大文件。

用法:
    cd tools/converter
    python gen_catalog.py              # 生成 DATA_CATALOG.md（全量索引）
    python gen_catalog.py --top 50     # 局部索引前 50 个最大文件 → DATA_CATALOG.top50.md
    python gen_catalog.py --filter Avatar  # 局部索引文件名含 Avatar 的 → DATA_CATALOG.filter-avatar.md
"""

import argparse
import json
import sys
from pathlib import Path

# Windows 控制台强制 UTF-8，避免中文输出乱码
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import EXCEL_DIR, TEXTMAP_DIR

OUTPUT_FILE = Path(__file__).resolve().parent / "DATA_CATALOG.md"


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
            # 遍历全部记录求字段并集：官方数据中可选字段可能仅出现在部分记录，
            # 只取首条记录会遗漏字段（曾导致 AI 依据索引误判字段不存在）
            fields: set[str] = set()
            for rec in data:
                if isinstance(rec, dict):
                    fields |= set(rec.keys())
            info["fields"] = sorted(fields)
            info["sample"] = truncate_record(data[0])
    elif isinstance(data, dict):
        info["type"] = "object"
        info["count"] = len(data)
        # 取前几个 key 作为样例
        sample_keys = list(data.keys())[:3]
        info["sample_keys"] = sample_keys
        if sample_keys:
            first_val = data[sample_keys[0]]
            if isinstance(first_val, dict):
                # 值字段并集（与数组型一致，防可选字段遗漏）
                fields = set()
                for v in data.values():
                    if isinstance(v, dict):
                        fields |= set(v.keys())
                info["fields"] = sorted(fields)
    else:
        info["type"] = type(data).__name__

    return info


def truncate_record(record: dict, max_str_len: int = 40) -> dict:
    """截断记录中的长字符串，用于样例展示。"""
    result = {}
    for k, v in record.items():
        if isinstance(v, str) and len(v) > max_str_len:
            result[k] = v[:max_str_len] + "..."
        elif isinstance(v, (list, dict)):
            s = json.dumps(v, ensure_ascii=False)
            if len(s) > max_str_len:
                result[k] = s[:max_str_len] + "..."
            else:
                result[k] = v
        else:
            result[k] = v
    return result


def format_catalog(entries: list[dict], textmap_info: dict) -> str:
    """生成 Markdown 格式的目录索引。"""
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

    # 按大小降序
    entries_sorted = sorted(entries, key=lambda x: x["size_mb"], reverse=True)

    for e in entries_sorted:
        if "error" in e:
            lines.append(f"### {e['name']} ({e['size_mb']:.2f} MB) ⚠️ 解析失败")
            lines.append(f"错误: {e['error']}")
            lines.append("")
            continue

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
        # 只对 CHS 文件统计条目数（其他语言文件太大，跳过加载）
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

    # 按大小排序后取 top N
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

    # 局部索引（--top / --filter）输出到独立文件，避免覆盖全量索引
    suffix = []
    if args.filter:
        suffix.append(f"filter-{args.filter.lower()}")
    if args.top > 0:
        suffix.append(f"top{args.top}")
    output_file = (
        OUTPUT_FILE.with_name(f"DATA_CATALOG.{'-'.join(suffix)}.md") if suffix else OUTPUT_FILE
    )

    print("生成索引 ...")
    catalog = format_catalog(entries, textmap_info)
    output_file.write_text(catalog, encoding="utf-8")
    print(f"✅ 已生成 {output_file} ({len(catalog) / 1024:.0f} KB)")
    if suffix:
        print(f"⚠️ 局部索引（{len(entries)} 个文件），请勿提交到版本控制")


if __name__ == "__main__":
    main()
