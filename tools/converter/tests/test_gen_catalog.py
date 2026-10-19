import json

import gen_catalog

def test_truncate_long_string():
    r = gen_catalog.truncate_record({"Name": "x" * 100})
    assert r["Name"] == "x" * 40 + "..."
    assert len(r["Name"]) == 43

def test_truncate_long_list_becomes_valid_summary():
    r = gen_catalog.truncate_record({"Tags": list(range(100))})
    assert r["Tags"] == "<list[100]>"

    r2 = gen_catalog.truncate_record({"Info": {f"k{i}": i for i in range(50)}})
    assert r2["Info"] == "<dict[50]>"

def test_truncate_json_roundtrip(tmp_path):
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
    p = tmp_path / "C.json"
    p.write_text("{invalid json", encoding="utf-8")
    info = gen_catalog.inspect_json_file(p)
    assert "error" in info
    assert info["name"] == "C.json"
