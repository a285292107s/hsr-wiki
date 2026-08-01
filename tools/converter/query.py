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

    # 解析 TextMap Hash（走 SQLite 缓存，首次自动建库）
    python query.py --resolve 6186714091647966180

    # 按文本内容搜索 TextMap（返回 hash + 文本）
    python query.py --search "黄泉"

    # 强制重建 TextMap SQLite 索引（源文件签名变更时也会自动重建）
    python query.py --rebuild-textmap

    # 跨文件搜索：在指定文件中搜索包含某值的记录
    python query.py AvatarConfig --grep "Ice" --limit 3

    # 显示前 N 条记录
    python query.py AvatarConfig --head 3
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import cast

# Windows 控制台强制 UTF-8，避免中文输出乱码
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")  # type: ignore[union-attr]

sys.path.insert(0, str(Path(__file__).resolve().parent))

# 同时支持脚本运行（from config）与模块运行（from .config）
if __package__ in (None, ""):
    from config import EXCEL_DIR  # pyright: ignore[reportImplicitRelativeImport]
    import textmap_db  # pyright: ignore[reportImplicitRelativeImport]
else:
    from .config import EXCEL_DIR
    from . import textmap_db

# JSON 数据结构（json.load 返回的动态数据统一收敛到此类型）
JSONValue = (
    bool
    | int
    | float
    | str
    | None
    | list["JSONValue"]
    | dict[str, "JSONValue"]
)

# 常见 ID 字段名（按优先级）
ID_FIELDS = [
    "AvatarID", "ID", "Id", "id", "LightconeID", "RelicID",
    "MonsterID", "StageID", "ItemID", "SkillID", "RankID",
    "MazeID", "PlaneID", "FloorID", "GroupID",
]


@dataclass
class QueryArgs:
    """解析后的查询参数（替代 argparse.Namespace 以消除 Any 泄漏）。"""

    id: str | None
    where: str
    fields: str
    grep: str
    head: int
    limit: int


def load_excel(filename: str) -> JSONValue:
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
        return cast("JSONValue", json.load(f))


def find_id_field(record: dict[str, JSONValue]) -> str | None:
    """自动检测记录的 ID 字段名。"""
    for field in ID_FIELDS:
        if field in record:
            return field
    return None


def print_json(data: JSONValue, compact: bool = False) -> None:
    """格式化输出 JSON。"""
    if compact:
        print(json.dumps(data, ensure_ascii=False, separators=(",", ":")))
    else:
        print(json.dumps(data, ensure_ascii=False, indent=2))


def cmd_schema(data: JSONValue, filename: str) -> None:
    """显示文件 schema 信息。"""
    if isinstance(data, list):
        print(f"文件: {filename}")
        print(f"类型: array")
        print(f"记录数: {len(data):,}")
        if data and isinstance(data[0], dict):
            first = data[0]
            fields = list(first.keys())
            print(f"字段数: {len(fields)}")
            print(f"字段列表:")
            for field in fields:
                val = first[field]
                type_name = type(val).__name__
                if isinstance(val, dict) and "Hash" in val:
                    type_name = "HashRef"
                elif isinstance(val, dict) and "Value" in val:
                    type_name = "ValueWrap"
                print(f"  {field}: {type_name}")
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
    """解析 TextMap Hash 值（走 SQLite 缓存）。"""
    result = textmap_db.resolve_hash(hash_val)
    if result is not None:
        print(f"Hash {hash_val} → {result}")
    else:
        print(f"Hash {hash_val} 未命中")


def cmd_search(keyword: str, limit: int = 20) -> None:
    """在 TextMap 中搜索包含关键词的文本（走 SQLite 缓存）。"""
    results = textmap_db.search_text(keyword, limit=limit)

    print(
        f"搜索 \"{keyword}\" → {len(results)} 条结果"
        + ("（已达上限）" if len(results) >= limit else "")
    )
    for k, v in results:
        # 截断过长文本
        display = v if len(v) <= 100 else v[:100] + "..."
        print(f"  [{k}] {display}")


def cmd_query(data: JSONValue, args: QueryArgs) -> None:
    """通用查询逻辑。"""
    if isinstance(data, list):
        records: list[JSONValue] = data
    elif isinstance(data, dict):
        records = list(data.values())
    else:
        records = []

    # --id 查询
    if args.id is not None:
        if records and isinstance(records[0], dict):
            id_field = find_id_field(records[0])
            if not id_field:
                print("错误: 无法自动检测 ID 字段，请用 --where 指定条件")
                sys.exit(1)
            # 支持数字和字符串比较
            target = args.id
            matches = [
                r
                for r in records
                if isinstance(r, dict) and str(r.get(id_field, "")) == str(target)
            ]
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
        filtered: list[JSONValue] = records
        for cond in conditions:
            if "=" not in cond:
                print(f"错误: --where 条件格式应为 字段=值，收到: {cond}")
                sys.exit(1)
            field, value = cond.split("=", 1)
            field = field.strip()
            value = value.strip()
            filtered = [
                r
                for r in filtered
                if isinstance(r, dict) and str(r.get(field, "")) == value
            ]
        records = filtered
        print(f"过滤结果: {len(records)} 条")

    # --grep 模糊搜索
    if args.grep:
        keyword = args.grep
        grepped: list[JSONValue] = []
        for r in records:
            if isinstance(r, dict):
                if any(
                    keyword in json.dumps(v, ensure_ascii=False) for v in r.values()
                ):
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
        records = [
            {k: (r.get(k) if isinstance(r, dict) else None) for k in field_list}
            for r in records
            if isinstance(r, dict)
        ]

    # 输出
    if len(records) == 1:
        print_json(records[0])
    else:
        print_json(records)


def main() -> None:
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
    _ = parser.add_argument("file", nargs="?", default="", help="ExcelOutput 下的 JSON 文件名（可省略 .json）")
    _ = parser.add_argument("--schema", action="store_true", help="显示文件 schema（字段列表 + 记录数）")
    _ = parser.add_argument("--id", type=str, default=None, help="按 ID 查询单条记录")
    _ = parser.add_argument("--where", type=str, default="", help="过滤条件（字段=值，多条件逗号分隔）")
    _ = parser.add_argument("--fields", type=str, default="", help="仅显示指定字段（逗号分隔）")
    _ = parser.add_argument("--grep", type=str, default="", help="在记录中模糊搜索包含指定文本的")
    _ = parser.add_argument("--head", type=int, default=0, help="显示前 N 条记录")
    _ = parser.add_argument("--limit", type=int, default=0, help="限制输出条数")
    _ = parser.add_argument("--list", type=str, default=None, nargs="?", const="", help="列出文件名（可选关键词过滤）")
    _ = parser.add_argument("--resolve", type=str, default="", help="解析 TextMap Hash 值")
    _ = parser.add_argument("--search", type=str, default="", help="在 TextMap 中搜索文本")
    _ = parser.add_argument("--rebuild-textmap", action="store_true", help="强制重建 TextMap SQLite 索引")

    ns = parser.parse_args()

    # 显式提取为带类型的局部变量，消除 argparse.Namespace 的 Any 泄漏
    file_arg: str = ns.file
    schema_arg: bool = ns.schema
    id_arg: str | None = ns.id
    where_arg: str = ns.where
    fields_arg: str = ns.fields
    grep_arg: str = ns.grep
    head_arg: int = ns.head
    limit_arg: int = ns.limit
    list_arg: str | None = ns.list
    resolve_arg: str = ns.resolve
    search_arg: str = ns.search
    rebuild_textmap_arg: bool = ns.rebuild_textmap

    # 全局命令（不需要文件名）
    if list_arg is not None:
        cmd_list(list_arg)
        return

    if rebuild_textmap_arg:
        textmap_db.rebuild(force=True)
        return

    if resolve_arg:
        cmd_resolve(resolve_arg)
        return

    if search_arg:
        cmd_search(search_arg, limit=limit_arg or 20)
        return

    # 需要文件名的命令
    if not file_arg:
        parser.print_help()
        sys.exit(0)

    data = load_excel(file_arg)

    if schema_arg:
        cmd_schema(data, file_arg)
        return

    cmd_query(
        data,
        QueryArgs(
            id=id_arg,
            where=where_arg,
            fields=fields_arg,
            grep=grep_arg,
            head=head_arg,
            limit=limit_arg,
        ),
    )


if __name__ == "__main__":
    main()
