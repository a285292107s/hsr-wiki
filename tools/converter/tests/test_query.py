"""query.py 查询逻辑与 schema 输出测试。

覆盖：--id / --where / --grep / --fields 过滤、schema 字段出现率
（可选字段全量扫描，历史教训回归）、dict 型对象字段并集。
不依赖真实源数据（合成 ExcelOutput 文件 + tmp_path 隔离目录）。
"""

import json

import pytest

import query


@pytest.fixture
def excel_dir(tmp_path, monkeypatch):
    """隔离的 ExcelOutput 目录；每次清空 lru_cache 防跨测试污染。"""
    query.load_excel.cache_clear()
    monkeypatch.setattr(query, "EXCEL_DIR", tmp_path)
    yield tmp_path
    query.load_excel.cache_clear()


def _write(dir_path, name: str, data) -> None:
    (dir_path / name).write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


def _args(**kwargs) -> query.QueryArgs:
    defaults = dict(id=None, where="", fields="", grep="", head=0, limit=0)
    defaults.update(kwargs)
    return query.QueryArgs(**defaults)


AVATARS = [
    {"AvatarID": 1001, "AvatarName": "希儿", "DamageType": "Quantum", "Rarity": 5},
    {"AvatarID": 1002, "AvatarName": "丹恒", "DamageType": "Wind", "Rarity": 4},
    {"AvatarID": 1003, "AvatarName": "姬子", "DamageType": "Fire", "Rarity": 5},
]


def test_query_by_id(excel_dir, capsys):
    _write(excel_dir, "AvatarConfig.json", AVATARS)
    data = query.load_excel("AvatarConfig")
    query.cmd_query(data, _args(id="1002"))
    out = capsys.readouterr().out
    assert "丹恒" in out
    assert "希儿" not in out
    assert "姬子" not in out


def test_query_where_multi(excel_dir, capsys):
    _write(excel_dir, "AvatarConfig.json", AVATARS)
    data = query.load_excel("AvatarConfig")
    query.cmd_query(data, _args(where="DamageType=Fire,Rarity=5"))
    out = capsys.readouterr().out
    assert "姬子" in out
    assert "希儿" not in out
    assert "丹恒" not in out


def test_query_grep(excel_dir, capsys):
    _write(excel_dir, "AvatarConfig.json", AVATARS)
    data = query.load_excel("AvatarConfig")
    query.cmd_query(data, _args(grep="姬"))
    out = capsys.readouterr().out
    assert "姬子" in out
    assert "希儿" not in out


def test_query_fields(excel_dir, capsys):
    _write(excel_dir, "AvatarConfig.json", AVATARS)
    data = query.load_excel("AvatarConfig")
    query.cmd_query(data, _args(id="1001", fields="AvatarName"))
    out = capsys.readouterr().out
    assert "AvatarName" in out
    assert "AvatarID" not in out
    assert "希儿" in out


def test_query_head_alias_of_limit(excel_dir, capsys):
    """--head 作为 --limit 别名生效。"""
    _write(excel_dir, "AvatarConfig.json", AVATARS)
    data = query.load_excel("AvatarConfig")
    query.cmd_query(data, _args(head=1))
    out = capsys.readouterr().out
    assert "显示前 1 条" in out
    assert "希儿" in out
    assert "丹恒" not in out


def test_schema_reports_optional_field_occurrence(excel_dir, capsys):
    """可选字段出现率 < 100%（历史教训回归：只扫首条记录会漏字段）。"""
    data = [
        {"ID": 1, "Name": "a"},
        {"ID": 2, "Name": "b", "Optional": 1},
    ]
    _write(excel_dir, "SchemaA.json", data)
    loaded = query.load_excel("SchemaA.json")
    query.cmd_schema(loaded, "SchemaA.json")
    out = capsys.readouterr().out
    assert "Optional" in out
    assert "50.0%" in out
    assert "ID: int" in out
    assert "出现率" in out


def test_schema_dict_scans_all_value_fields(excel_dir, capsys):
    """dict 型文件输出全部值对象的字段并集（修复：原仅取首个键）。"""
    data = {
        "a": {"Name": "x", "ID": 1},
        "b": {"Name": "y", "ID": 2, "Extra": True},
    }
    _write(excel_dir, "SchemaB.json", data)
    loaded = query.load_excel("SchemaB.json")
    query.cmd_schema(loaded, "SchemaB.json")
    out = capsys.readouterr().out
    assert "Extra" in out
    assert "Name" in out
    assert "ID" in out


def test_schema_recognizes_hash_and_value_wraps(excel_dir, capsys):
    """HashRef / ValueWrap 特殊类型识别。"""
    data = [
        {"ID": 1, "Desc": {"Hash": 6186714091647966180}, "Param": {"Value": 3}},
    ]
    _write(excel_dir, "SchemaC.json", data)
    loaded = query.load_excel("SchemaC.json")
    query.cmd_schema(loaded, "SchemaC.json")
    out = capsys.readouterr().out
    assert "HashRef" in out
    assert "ValueWrap" in out
