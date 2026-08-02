"""TextMap SQLite 缓存：跨进程持久化加速 query.py 的 --resolve / --search。

设计要点：
- DB 文件位于 tools/converter/.textmap-cache.db（已 gitignore）
- 基于源文件 mtime_ns:size 签名自动检测失效（与 incremental.py 签名风格一致）
- 首次查询或源文件变更时自动重建（~5-8s），后续查询走索引（<1ms）
- 仅服务 query.py 开发查询路径，convert.py / textmap.py 不依赖本模块
"""

from __future__ import annotations

import json
import logging
import sqlite3
import sys
import time
from pathlib import Path
from typing import cast

if __package__ in (None, ""):
    from config import TEXTMAP_FILE  # pyright: ignore[reportImplicitRelativeImport]
else:
    from .config import TEXTMAP_FILE

logger = logging.getLogger("converter")

DB_FILE = Path(__file__).resolve().parent / ".textmap-cache.db"

# 批量插入分块大小（平衡内存与事务开销）
_BATCH_SIZE = 50_000

_conn: sqlite3.Connection | None = None


def _source_sig(path: Path) -> str:
    """源文件签名：mtime_ns:size（与 incremental.py 风格一致）。"""
    try:
        st = path.stat()
        return f"{st.st_mtime_ns}:{st.st_size}"
    except OSError:
        return "missing"


def _open_raw() -> sqlite3.Connection:
    """打开 DB 原始连接（不走自动校验）。损坏时先释放句柄再抛 DatabaseError。"""
    conn = sqlite3.connect(DB_FILE)
    try:
        conn.execute("PRAGMA journal_mode=WAL")
    except sqlite3.DatabaseError:
        conn.close()
        raise
    return conn


def _is_valid(conn: sqlite3.Connection) -> bool:
    """校验 DB 中记录的源签名是否与当前 TextMap 一致。"""
    try:
        row = conn.execute(
            "SELECT value FROM meta WHERE key = 'source_sig'"
        ).fetchone()
    except sqlite3.DatabaseError:
        return False
    return bool(row) and row[0] == _source_sig(TEXTMAP_FILE)


def _build(conn: sqlite3.Connection) -> None:
    """从 TextMapCHS.json 全量重建索引（事务化，失败不留半成品）。"""
    if not TEXTMAP_FILE.exists():
        raise FileNotFoundError(f"TextMap 文件不存在: {TEXTMAP_FILE}")

    print(f"构建 TextMap SQLite 索引（{TEXTMAP_FILE.name}，可能需要几秒）...")
    started = time.perf_counter()

    with open(TEXTMAP_FILE, encoding="utf-8") as f:
        data = cast("dict[str, str]", json.load(f))

    conn.execute("DROP TABLE IF EXISTS textmap")
    conn.execute("DROP TABLE IF EXISTS meta")
    conn.execute(
        "CREATE TABLE textmap (hash TEXT PRIMARY KEY, text TEXT NOT NULL) WITHOUT ROWID"
    )
    conn.execute("CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT)")

    items = list(data.items())
    total = len(items)
    for i in range(0, total, _BATCH_SIZE):
        conn.executemany(
            "INSERT INTO textmap (hash, text) VALUES (?, ?)",
            items[i : i + _BATCH_SIZE],
        )
    conn.execute(
        "INSERT INTO meta (key, value) VALUES ('source_sig', ?)",
        (_source_sig(TEXTMAP_FILE),),
    )
    conn.commit()

    elapsed = time.perf_counter() - started
    size_mb = DB_FILE.stat().st_size / (1024 * 1024)
    print(f"索引构建完成：{total:,} 条，{size_mb:.1f} MB，耗时 {elapsed:.1f}s")


def _get_conn() -> sqlite3.Connection:
    """获取可用连接（懒加载 + 自动校验/重建；损坏 DB 自动删除重建）。"""
    global _conn
    if _conn is not None:
        return _conn

    need_build = False
    if not DB_FILE.exists():
        need_build = True
        conn = _open_raw()
    else:
        try:
            conn = _open_raw()
            if not _is_valid(conn):
                need_build = True
        except sqlite3.DatabaseError:
            # DB 文件损坏（被截断/非 SQLite 内容）：_open_raw 已释放句柄，删除后重建
            logger.warning("TextMap 缓存损坏，删除并重建: %s", DB_FILE)
            DB_FILE.unlink(missing_ok=True)
            conn = _open_raw()
            need_build = True

    if need_build:
        try:
            _build(conn)
        except Exception:
            conn.close()
            raise

    _conn = conn
    return conn


def _ensure_fresh() -> sqlite3.Connection:
    """获取连接，并在源签名变化时自动重建（每次查询前校验，成本仅一次 stat）。

    仅靠 _get_conn 的首次校验时，同一进程内源文件变更后不会触发重建；
    这里在每次 resolve/search 前复查签名，与模块文档“源文件变更时自动重建”一致。
    """
    global _conn
    if _conn is None:
        return _get_conn()
    if _is_valid(_conn):
        return _conn
    logger.info("TextMap 源文件已变更，重建索引")
    _build(_conn)
    return _conn


def resolve_hash(hash_val: str) -> str | None:
    """按 Hash 查询文本（主键索引，<1ms）。未命中返回 None。"""
    conn = _ensure_fresh()
    row = conn.execute(
        "SELECT text FROM textmap WHERE hash = ?", (hash_val,)
    ).fetchone()
    return row[0] if row else None


def search_text(keyword: str, limit: int = 20) -> list[tuple[str, str]]:
    """按文本子串搜索（LIKE 全表扫描，~100-300ms）。"""
    conn = _ensure_fresh()
    # 转义 LIKE 元字符，避免 % / _ / \ 被解释为通配符
    escaped = (
        keyword.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    )
    rows = conn.execute(
        "SELECT hash, text FROM textmap WHERE text LIKE ? ESCAPE '\\' LIMIT ?",
        (f"%{escaped}%", limit),
    ).fetchall()
    return [(str(h), str(t)) for h, t in rows]


def rebuild(force: bool = False) -> None:
    """显式重建索引。force=True 时无视签名强制重建。"""
    global _conn
    if _conn is not None:
        _conn.close()
        _conn = None

    if not force and DB_FILE.exists():
        conn = _open_raw()
        try:
            if _is_valid(conn):
                print("索引已是最新（源文件签名一致），无需重建")
                return
        finally:
            conn.close()

    conn = _open_raw()
    try:
        _build(conn)
    finally:
        conn.close()


def close() -> None:
    """关闭连接（CLI 退出时可选调用，主要服务于测试）。"""
    global _conn
    if _conn is not None:
        _conn.close()
        _conn = None


if __name__ == "__main__":
    # 支持 python textmap_db.py 直接重建（调试用）
    logging.basicConfig(level=logging.INFO)
    rebuild(force="--force" in sys.argv)
