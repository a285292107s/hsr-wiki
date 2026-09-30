"""一次性历史引导：回填 characters.json / light_cones.json 的 release_version。

角色 / 光锥的 release_version 由「与上一版已提交输出的 id 差集」推导（release_version.py），
只能从机制启用后开始积累，故用 git 版本快照（同一 commit 的 version.json version_label +
该 commit 的两个索引 JSON）按「首次出现的快照版本」一次性回填。

禁止当作常规流程或在浅克隆里跑：本脚本靠 `git show <commit>:...` 读历史快照，CI 的
actions/checkout 默认 fetch-depth: 1（.github/workflows/data-sync.yml）下必然失败。
最早可追溯快照（4.4.0）里已存在的条目一律留空串（上线版本先于可追溯区间，不猜）。
默认只补空串，不覆盖 convert 已打的标；`--overwrite` 才按快照推导值全量重写（仅用于纠错）。

用法：cd tools/converter && python backfill_release_versions.py [--dry-run] [--overwrite]
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from collections import Counter
from functools import lru_cache
from pathlib import Path
from typing import Sequence

sys.path.insert(0, str(Path(__file__).resolve().parent))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from config import OUTPUT_DIR, PROJECT_ROOT  # noqa: E402
from release_version import apply_release_versions, tag_release_versions  # noqa: E402
from utils import save_json  # noqa: E402

VERSION_JSON = "public/data/cn/version.json"
INDEX_FILES = {
    "characters": "public/data/cn/characters.json",
    "light_cones": "public/data/cn/light_cones.json",
}

def _git(*args: str) -> str:
    """在项目根执行 git；失败抛 RuntimeError（含 git show 在浅克隆下不可用的提示）。

    必须显式 encoding="utf-8"：Windows 默认 GBK 会让含中文的索引 JSON 解码失败。
    """
    proc = subprocess.run(
        ["git", "-C", str(PROJECT_ROOT), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        timeout=60,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(
            f"git {' '.join(args)} 失败（{proc.stderr.strip()[:200]}）；"
            "本脚本需要完整 git 历史，浅克隆（fetch-depth: 1）下不可用"
        )
    return proc.stdout

@lru_cache(maxsize=None)
def _version_label(commit: str) -> str:
    """该 commit 的 version.json 的 version_label；缺失时返回空串。"""
    data = json.loads(_git("show", f"{commit}:{VERSION_JSON}"))
    return str(data.get("version_label", "")) if isinstance(data, dict) else ""

@lru_cache(maxsize=None)
def _index_ids(commit: str, path: str) -> tuple[int, ...]:
    """该 commit 的索引 JSON 里的 id 序列（文件不存在 / 空内容 → 空元组）。"""
    try:
        raw = _git("show", f"{commit}:{path}")
    except RuntimeError:
        return ()
    if not raw.strip():
        return ()
    data = json.loads(raw)
    if not isinstance(data, list):
        return ()
    return tuple(item["id"] for item in data if isinstance(item, dict) and item.get("id") is not None)

def snapshot_commits() -> list[str]:
    """version.json 的全部提交，按时间**升序**（最早在前）。"""
    out = _git("log", "--reverse", "--format=%H", "--", VERSION_JSON)
    return [line for line in out.splitlines() if line.strip()]

def first_seen_versions(snapshots: Sequence[tuple[str, Sequence[int]]]) -> dict[str, str]:
    """快照（时间升序，元素为 (version_label, ids)）→ {id: 首次出现的快照版本}。

    最早快照里已存在的 id 记空串（上线版本先于可追溯区间，不猜）；同一 id 只记首次出现。
    """
    first: dict[str, str] = {}
    for index, (label, ids) in enumerate(snapshots):
        for item_id in ids:
            key = str(item_id)
            if key in first:
                continue
            first[key] = "" if index == 0 else label
    return first

def parse_args(argv: Sequence[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="一次性回填角色 / 光锥索引的 release_version")
    parser.add_argument("--dry-run", action="store_true", help="只打印将写入的分布，不改文件")
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="按快照推导值全量重写（含清空推导不出的条目）；默认只补空串",
    )
    return parser.parse_args(argv)

def main(argv: Sequence[str] | None = None) -> int:
    args = parse_args(argv)

    commits = snapshot_commits()
    if len(commits) < 2:
        print(
            f"错误：git 历史里只有 {len(commits)} 个版本快照，无法区分「新增」；"
            "需要完整 git 历史（浅克隆 fetch-depth: 1 下不可用）",
            file=sys.stderr,
        )
        return 1

    per_file: dict[str, list[tuple[str, tuple[int, ...]]]] = {name: [] for name in INDEX_FILES}
    for commit in commits:
        label = _version_label(commit)
        if not label:
            print(f"警告：{commit[:8]} 的 version.json 无 version_label，跳过该快照", file=sys.stderr)
            continue
        for name, path in INDEX_FILES.items():
            per_file[name].append((label, _index_ids(commit, path)))

    shown = ", ".join(f"{c[:8]}={_version_label(c)}" for c in commits)
    print(f"版本快照 {len(commits)} 个（时间升序）: {shown}")

    for name in INDEX_FILES:
        out_path = OUTPUT_DIR / f"{name}.json"
        if not out_path.exists():
            print(f"错误：输出文件不存在: {out_path}", file=sys.stderr)
            return 1
        entries = json.loads(out_path.read_text(encoding="utf-8"))

        seen = first_seen_versions(per_file[name])
        derived = tag_release_versions(
            [entry["id"] for entry in entries if entry.get("id") is not None],
            seen,
            current_version="",
        )
        versions: dict[str, str] = {}
        for entry in entries:
            if entry.get("id") is None:
                continue
            key = str(entry["id"])
            versions[key] = (
                derived.get(key, "")
                if args.overwrite
                else (entry.get("release_version") or "") or derived.get(key, "")
            )

        changed = sum(
            1
            for entry in entries
            if entry.get("id") is not None
            and entry.get("release_version") != versions[str(entry["id"])]
        )
        dist = Counter(value or "(空串)" for value in versions.values())
        print(f"{name}: {len(entries)} 条，命中快照 {len(seen)} 个 id，将改写 {changed} 条；分布 {dict(sorted(dist.items()))}")

        if args.dry_run or changed == 0:
            continue
        apply_release_versions(entries, versions)
        save_json(entries, out_path)

    if args.dry_run:
        print("--dry-run：未写入任何文件")
    return 0

if __name__ == "__main__":
    sys.exit(main())
