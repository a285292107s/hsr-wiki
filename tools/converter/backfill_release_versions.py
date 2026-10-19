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
    data = json.loads(_git("show", f"{commit}:{VERSION_JSON}"))
    return str(data.get("version_label", "")) if isinstance(data, dict) else ""

@lru_cache(maxsize=None)
def _index_ids(commit: str, path: str) -> tuple[int, ...]:
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
    out = _git("log", "--reverse", "--format=%H", "--", VERSION_JSON)
    return [line for line in out.splitlines() if line.strip()]

def first_seen_versions(snapshots: Sequence[tuple[str, Sequence[int]]]) -> dict[str, str]:
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
