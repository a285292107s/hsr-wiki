"""gen_catalog.py 索引生成逻辑测试。

覆盖：长字符串截断、长 list/dict 摘要（保证样例为合法 JSON）、
短值原样保留、数组/dict/解析失败三种文件形态检查。
不依赖真实源数据（合成 JSON + tmp_path）。
"""

import json

import gen_catalog

def test_truncate_long_string():
    """超长字符串截断并加省略号。"""
    r = gen_catalog.truncate_record({"Name": "x" * 100})
    assert r["Name"] == "x" * 40 + "..."
    assert len(r["Name"]) == 43

def test_truncate_long_list_becomes_valid_summary():
    """长 list/dict 改为结构化摘要，输出必须是合法 JSON（修复回归）。

    判据是等值断言（摘要字符串本身）；**不写 `json.dumps(r)` 之类的"合法性"断言**——
    dict 无论装什么都能 dumps 成功，退回原 bug（`result[k] = v` 直接塞原始 list）
    时那种断言照样通过（实测突变），锁不住回归。
    """
    r = gen_catalog.truncate_record({"Tags": list(range(100))})
    assert r["Tags"] == "<list[100]>"

    r2 = gen_catalog.truncate_record({"Info": {f"k{i}": i for i in range(50)}})
    assert r2["Info"] == "<dict[50]>"

def test_truncate_json_roundtrip(tmp_path):
    """完整样例（截断后）写入文件后仍可被 json.load 解析。"""
    p = tmp_path / "A.json"
    p.write_text(
        json.dumps(
            [{"ID": 1, "LongText": "y" * 500, "Items": list(range(200))}],
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    info = gen_catalog.inspect_json_file(p)
    sample = info["sample"]
    assert sample["LongText"].endswith("...")
    assert sample["Items"] == "<list[200]>"

def test_inspect_array_union_fields(tmp_path):
    """数组型文件字段为全量并集（可选字段不漏报）。"""
    p = tmp_path / "A.json"
    p.write_text(
        json.dumps([{"ID": 1, "Name": "a"}, {"ID": 2, "Optional": 1}], ensure_ascii=False),
        encoding="utf-8",
    )
    info = gen_catalog.inspect_json_file(p)
    assert info["type"] == "array"
    assert info["count"] == 2
    assert set(info["fields"]) == {"ID", "Name", "Optional"}

def test_inspect_dict_union_fields(tmp_path):
    """dict 型文件值字段为全量并集。"""
    p = tmp_path / "B.json"
    p.write_text(
        json.dumps(
            {"k1": {"A": 1}, "k2": {"B": 2, "A": 3}},
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    info = gen_catalog.inspect_json_file(p)
    assert info["type"] == "object"
    assert info["count"] == 2
    assert set(info["fields"]) == {"A", "B"}

def test_inspect_parse_error_records_error(tmp_path):
    """解析失败记录 error 字段，不中断整体。"""
    p = tmp_path / "C.json"
    p.write_text("{invalid json", encoding="utf-8")
    info = gen_catalog.inspect_json_file(p)
    assert "error" in info
    assert info["name"] == "C.json"
