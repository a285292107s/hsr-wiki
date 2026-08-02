"""textmap_db 的 TextMap SQLite 缓存逻辑测试。

覆盖：懒加载自动建库、签名失效自动重建、LIKE 元字符转义、
force 重建、损坏 DB 自愈、源文件缺失报错。
不依赖真实源数据（合成 TextMap + tmp_path 隔离 DB 文件）。
"""

import json

import pytest

import textmap_db


def _write_textmap(path, data: dict) -> None:
    path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")


@pytest.fixture
def db_env(tmp_path, monkeypatch):
    """隔离的缓存环境：DB 文件与 TextMap 源文件都指向临时目录。"""
    textmap_db.close()  # 关闭模块级连接，模拟干净进程
    src = tmp_path / "TextMapCHS.json"
    db = tmp_path / ".textmap-cache.db"
    monkeypatch.setattr(textmap_db, "TEXTMAP_FILE", src)
    monkeypatch.setattr(textmap_db, "DB_FILE", db)
    yield {"src": src, "db": db}
    textmap_db.close()


def test_first_query_auto_builds_and_resolves(db_env):
    """首次查询自动建库；命中返回文本，未命中返回 None。"""
    _write_textmap(db_env["src"], {"100": "开拓者", "200": "毁灭"})
    assert textmap_db.resolve_hash("100") == "开拓者"
    assert textmap_db.resolve_hash("200") == "毁灭"
    assert textmap_db.resolve_hash("999") is None


def test_source_change_triggers_auto_rebuild(db_env):
    """源文件变更（size 变化）后下次查询自动重建索引。"""
    _write_textmap(db_env["src"], {"100": "旧文本"})
    assert textmap_db.resolve_hash("100") == "旧文本"

    # 修改源文件内容（size 变化 → 签名变化）
    _write_textmap(db_env["src"], {"100": "新文本", "200": "新增"})
    assert textmap_db.resolve_hash("100") == "新文本"
    assert textmap_db.resolve_hash("200") == "新增"


def test_search_text_escapes_like_meta(db_env):
    """LIKE 元字符（% _ \\）必须按字面匹配，不能当通配符。"""
    _write_textmap(
        db_env["src"],
        {
            "1": "命中率 100%",
            "2": "a_b",
            "3": "aXb",  # 用于验证 _ 不是通配符
            "4": "back\\slash",
        },
    )
    # % 字面匹配：搜索 "100%" 只命中字面含 % 的文本
    assert dict(textmap_db.search_text("100%")) == {"1": "命中率 100%"}
    # _ 字面匹配：a_b 不匹配 aXb
    assert dict(textmap_db.search_text("a_b")) == {"2": "a_b"}
    # 反斜杠字面匹配
    assert dict(textmap_db.search_text("back\\slash")) == {"4": "back\\slash"}
    # 命中多条（a_b / aXb / back\slash 都含字母 a）
    assert len(textmap_db.search_text("a", limit=10)) == 3


def test_search_text_limit(db_env):
    """limit 参数生效。"""
    _write_textmap(db_env["src"], {"1": "文本一", "2": "文本二", "3": "文本三"})
    assert len(textmap_db.search_text("文本", limit=2)) == 2


def test_rebuild_force(db_env):
    """force 重建无视签名强制刷新。"""
    _write_textmap(db_env["src"], {"1": "a"})
    assert textmap_db.resolve_hash("1") == "a"

    _write_textmap(db_env["src"], {"1": "b", "2": "c"})
    textmap_db.rebuild(force=True)
    assert textmap_db.resolve_hash("1") == "b"
    assert textmap_db.resolve_hash("2") == "c"


def test_rebuild_when_up_to_date_noop(db_env, capsys):
    """签名一致时非 force 重建直接跳过（不报错）。"""
    _write_textmap(db_env["src"], {"1": "a"})
    assert textmap_db.resolve_hash("1") == "a"

    textmap_db.rebuild(force=False)
    out = capsys.readouterr().out
    assert "无需重建" in out
    assert textmap_db.resolve_hash("1") == "a"


def test_corrupt_db_recovers(db_env):
    """DB 文件损坏（非 SQLite 内容）时自动删除并重建，查询仍可用。"""
    _write_textmap(db_env["src"], {"1": "a"})
    assert textmap_db.resolve_hash("1") == "a"

    textmap_db.close()  # 模拟进程重启（否则旧连接不受损坏文件影响）
    db_env["db"].write_bytes(b"not a sqlite database at all")

    assert textmap_db.resolve_hash("1") == "a"
    # 重建后索引内容正确
    assert textmap_db.resolve_hash("999") is None


def test_missing_source_raises(db_env):
    """TextMap 源文件缺失时明确报错，不留下半成品 DB。"""
    with pytest.raises(FileNotFoundError):
        textmap_db.resolve_hash("1")
