import json

import pytest

import textmap_db

def _write_textmap(path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")

@pytest.fixture
def db_env(tmp_path, monkeypatch):
    textmap_db.close()
    src = tmp_path / "TextMapCHS.json"
    db = tmp_path / ".textmap-cache.db"
    monkeypatch.setattr(textmap_db, "TEXTMAP_FILE", src)
    monkeypatch.setattr(textmap_db, "DB_FILE", db)
    yield {"src": src, "db": db}
    textmap_db.close()

def test_first_query_auto_builds_and_resolves(db_env):
    _write_textmap(db_env["src"], {"100": "开拓者", "200": "毁灭"})
    assert textmap_db.resolve_hash("100") == "开拓者"
    assert textmap_db.resolve_hash("200") == "毁灭"
    assert textmap_db.resolve_hash("999") is None

def test_source_change_triggers_auto_rebuild(db_env):
    _write_textmap(db_env["src"], {"100": "旧文本"})
    assert textmap_db.resolve_hash("100") == "旧文本"

    _write_textmap(db_env["src"], {"100": "新文本", "200": "新增"})
    assert textmap_db.resolve_hash("100") == "新文本"
    assert textmap_db.resolve_hash("200") == "新增"

def test_search_text_escapes_like_meta(db_env):
    _write_textmap(
        db_env["src"],
        {
            "1": "命中率 100%",
            "2": "a_b",
            "3": "aXb",
            "4": "back\\slash",
        },
    )
    assert dict(textmap_db.search_text("100%")) == {"1": "命中率 100%"}
    assert dict(textmap_db.search_text("a_b")) == {"2": "a_b"}
    assert dict(textmap_db.search_text("back\\slash")) == {"4": "back\\slash"}
    assert len(textmap_db.search_text("a", limit=10)) == 3

def test_search_text_limit(db_env):
    _write_textmap(db_env["src"], {"1": "文本一", "2": "文本二", "3": "文本三"})
    assert len(textmap_db.search_text("文本", limit=2)) == 2

def test_rebuild_force(db_env):
    _write_textmap(db_env["src"], {"1": "a"})
    assert textmap_db.resolve_hash("1") == "a"

    _write_textmap(db_env["src"], {"1": "b", "2": "c"})
    textmap_db.rebuild(force=True)
    assert textmap_db.resolve_hash("1") == "b"
    assert textmap_db.resolve_hash("2") == "c"

def test_rebuild_when_up_to_date_noop(db_env, capsys):
    _write_textmap(db_env["src"], {"1": "a"})
    assert textmap_db.resolve_hash("1") == "a"

    textmap_db.rebuild(force=False)
    out = capsys.readouterr().out
    assert "无需重建" in out
    assert textmap_db.resolve_hash("1") == "a"

def test_corrupt_db_recovers(db_env):
    _write_textmap(db_env["src"], {"1": "a"})
    assert textmap_db.resolve_hash("1") == "a"

    textmap_db.close()
    db_env["db"].write_bytes(b"not a sqlite database at all")

    assert textmap_db.resolve_hash("1") == "a"
    assert textmap_db.resolve_hash("999") is None

def test_missing_source_raises(db_env):
    with pytest.raises(FileNotFoundError):
        textmap_db.resolve_hash("1")
