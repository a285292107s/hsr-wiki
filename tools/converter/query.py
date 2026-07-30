"""ExcelOutput / TextMap 数据查询 CLI 工具。

供 AI 或开发者精确查询子模块数据，无需手动打开 GB 级 JSON 文件。

用法:
    cd tools/converter

    # 查看文件 schema（字段列表 + 记录数）
    python query.py AvatarConfig --schema

    # 按 ID 查询单条记录（自动检测 ID 字段名）
    python query.py AvatarConfig --id 1001

    # 按条件过滤（字段=值）
    python query.py AvatarConfig --where "DamageType=Ice" --limit 5

    # 仅显示指定字段
    python query.py AvatarConfig --id 1001 --fields AvatarName,DamageType,Rarity

    # 列出所有文件名（支持模糊搜索）
    python query.py --list Avatar

    # 解析 TextMap Hash
    python query.py --resolve 6186714091647966180

    # 按文本内容搜索 TextMap（返回 hash + 文本）
    python query.py --search "黄泉"

    # 跨文件搜索：在指定文件中搜索包含某值的记录
    python query.py AvatarConfig --grep "Ice" --limit 3

    # 显示前 N 条记录
    python query.py AvatarConfig --head 3
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from config import EXCEL_DIR, TEXTMAP_DIR, TEXTMAP_FILE

# 常见 ID 字段名（按优先级）
ID_FIELDS = [
    "AvatarID", "ID", "Id", "id", "LightconeID", "RelicID",
    "MonsterID", "StageID", "ItemID", "SkillID", "RankID",
    "MazeID", "PlaneID", "FloorID", "GroupID",
]


def load_excel(filename: str) -> Any:
    """加载 ExcelOutput 下的 JSON 文件。"""
    # 支持省略 .json 后缀
    if not filename.endswith(".json"):
        filename += ".json"
    path = EXCEL_DIR / filename
    if not path.exists():
        print(f"错误: 文件不存在 {path}")
        print(f"提示: 用 --list <关键词> 搜索文件名")
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def find_id_field(record: dict) -> str | None:
    """自动检测记录的 ID 字段名。"""
    for field in ID_FIELDS:
        if field in record:
            return field
    return None


def print_json(data: Any, compact: bool = False) -> None:
    """格式化输出 JSON。"""
    if compact:
        print(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    else:
        print(json.dumps(data, ensure_ascii=False, indent=2))


def cmd_schema(data: Any, filename: str) -> None:
    """显示文件 schema 信息。"""
    if isinstance(data, list):
        print(f"文件: {filename}")
        print(f"类型: array")
        print(f"记录数: {len(data):,}")
        if data and isinstance(data[0], dict):
            fields = list(data[0].keys())
            print(f"字段数: {len(fields)}")
            print(f"字段列表:")
            for f in fields:
                val = data[0][f]
                type_name = type(val).__name__
                if isinstance(val, dict) and "Hash" in val:
                    type_name = "HashRef"
                elif isinstance(val, dict) and "Value" in val:
                    type_name = "ValueWrap"
                print(f"  {f}: {type_name}")
    elif isinstance(data, dict):
        print(f"文件: {filename}")
        print(f"类型: object (dict)")
        print(f"键数: {len(data):,}")
        sample_keys = list(data.keys())[:5]
        print(f"键样例: {sample_keys}")
        if sample_keys:
            first = data[sample_keys[0]]
            if isinstance(first, dict):
                print(f"值字段: {list(first.keys())}")


def cmd_list(keyword: str) -> None:
    """列出 ExcelOutput 下匹配关键词的文件。"""
    files = sorted(EXCEL_DIR.glob("*.json"))
    if keyword:
        files = [f for f in files if keyword.lower() in f.name.lower()]
    print(f"匹配文件 ({len(files)} 个):")
    for f in files:
        size_mb = f.stat().st_size / (1024 * 1024)
        print(f"  {f.name:<50} {size_mb:>7.2f} MB")


def cmd_resolve(hash_val: str) -> None:
    """解析 TextMap Hash 值。"""
    if not TEXTMAP_FILE.exists():
        print(f"错误: TextMap 文件不存在 {TEXTMAP_FILE}")
        sys.exit(1)
    print(f"加载 TextMap（可能需要几秒）...")
    with open(TEXTMAP_FILE, encoding="utf-8") as f:
        textmap = json.load(f)
    result = textmap.get(hash_val)
    if result:
        print(f"Hash {hash_val} → {result}")
    else:
        print(f"Hash {hash_val} 未命中")


def cmd_search(keyword: str, limit: int = 20) -> None:
    """在 TextMap 中搜索包含关键词的文本。"""
    if not TEXTMAP_FILE.exists():
        print(f"错误: TextMap 文件不存在 {TEXTMAP_FILE}")
        sys.exit(1)
    print(f"加载 TextMap（可能需要几秒）...")
    with open(TEXTMAP_FILE, encoding="utf-8") as f:
        textmap = json.load(f)

    results = []
    for k, v in textmap.items():
        if keyword in v:
            results.append((k, v))
            if len(results) >= limit:
                break

    print(f"搜索 \"{keyword}\" → {len(results)} 条结果" + ("（已达上限）" if len(results) >= limit else ""))
    for k, v in results:
        # 截断过长文本
        display = v if len(v) <= 100 else v[:100] + "..."
        print(f"  [{k}] {display}")


def cmd_query(data: Any, args: argparse.Namespace, filename: str) -> None:
    """通用查询逻辑。"""
    records = data if isinstance(data, list) else list(data.values())

    # --id 查询
    if args.id is not None:
        if records and isinstance(records[0], dict):
            id_field = find_id_field(records[0])
            if not id_field:
                print("错误: 无法自动检测 ID 字段，请用 --where 指定条件")
                sys.exit(1)
            # 支持数字和字符串比较
            target = args.id
            matches = [r for r in records if str(r.get(id_field, "")) == str(target)]
            if not matches:
                print(f"未找到 {id_field}={target} 的记录")
                return
            records = matches
        else:
            print("错误: 数据不是字典数组，无法按 ID 查询")
            return

    # --where 过滤
    if args.where:
        conditions = args.where.split(",")
        filtered = records
        for cond in conditions:
            if "=" not in cond:
                print(f"错误: --where 条件格式应为 字段=值，收到: {cond}")
                sys.exit(1)
            field, value = cond.split("=", 1)
            field = field.strip()
            value = value.strip()
            filtered = [r for r in filtered if isinstance(r, dict) and str(r.get(field, "")) == value]
        records = filtered
        print(f"过滤结果: {len(records)} 条")

    # --grep 模糊搜索
    if args.grep:
        keyword = args.grep
        grepped = []
        for r in records:
            if isinstance(r, dict):
                if any(keyword in json.dumps(v, ensure_ascii=False) for v in r.values()):
                    grepped.append(r)
            elif isinstance(r, str) and keyword in r:
                grepped.append(r)
        records = grepped
        print(f"grep \"{keyword}\" → {len(records)} 条")

    # --head / --limit
    limit = args.limit or args.head or 10
    if len(records) > limit:
        print(f"（显示前 {limit} 条，共 {len(records)} 条）")
        records = records[:limit]

    # --fields 筛选
    if args.fields and records and isinstance(records[0], dict):
        field_list = [f.strip() for f in args.fields.split(",")]
        records = [{k: r.get(k) for k in field_list} for r in records if isinstance(r, dict)]

    # 输出
    if len(records) == 1:
        print_json(records[0])
    else:
        print_json(records)


def main():
    parser = argparse.ArgumentParser(
        description="ExcelOutput / TextMap 数据查询工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python query.py AvatarConfig --schema
  python query.py AvatarConfig --id 1001
  python query.py AvatarConfig --where "DamageType=Ice" --limit 5
  python query.py AvatarConfig --id 1001 --fields AvatarName,DamageType
  python query.py --list Avatar
  python query.py --resolve 6186714091647966180
  python query.py --search "黄泉"
  python query.py AvatarConfig --grep "Ice" --limit 3
  python query.py AvatarConfig --head 3
        """,
    )
    parser.add_argument("file", nargs="?", default="", help="ExcelOutput 下的 JSON 文件名（可省略 .json）")
    parser.add_argument("--schema", action="store_true", help="显示文件 schema（字段列表 + 记录数）")
    parser.add_argument("--id", type=str, default=None, help="按 ID 查询单条记录")
    parser.add_argument("--where", type=str, default="", help="过滤条件（字段=值，多条件逗号分隔）")
    parser.add_argument("--fields", type=str, default="", help="仅显示指定字段（逗号分隔）")
    parser.add_argument("--grep", type=str, default="", help="在记录中模糊搜索包含指定文本的")
    parser.add_argument("--head", type=int, default=0, help="显示前 N 条记录")
    parser.add_argument("--limit", type=int, default=0, help="限制输出条数")
    parser.add_argument("--list", type=str, default=None, nargs="?", const="", help="列出文件名（可选关键词过滤）")
    parser.add_argument("--resolve", type=str, default="", help="解析 TextMap Hash 值")
    parser.add_argument("--search", type=str, default="", help="在 TextMap 中搜索文本")

    args = parser.parse_args()

    # 全局命令（不需要文件名）
    if args.list is not None:
        cmd_list(args.list)
        return

    if args.resolve:
        cmd_resolve(args.resolve)
        return

    if args.search:
        cmd_search(args.search, limit=args.limit or 20)
        return

    # 需要文件名的命令
    if not args.file:
        parser.print_help()
        sys.exit(0)

    data = load_excel(args.file)

    if args.schema:
        cmd_schema(data, args.file)
        return

    cmd_query(data, args, args.file)


if __name__ == "__main__":
    main()
