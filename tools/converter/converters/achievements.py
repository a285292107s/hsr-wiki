"""成就数据转换器

完整表→字段→输出映射与描述处理规则见 docs/data/转换器字段映射.md（achievements 段）。
源：AchievementData.json(1869) / AchievementSeries.json(9) / TextJoinConfig / TextJoinItem。
输出：public/data/cn/achievements.json(系列Priority升+成就Priority降) / achievement_series.json。
"""
from __future__ import annotations

import hashlib
import json
import logging
import math
import re
from pathlib import Path
from typing import Any, Mapping

from config import EXCEL_DIR, OUTPUT_DIR
from textmap import clean_text, current_textmap, resolve_text, text_key_of
from textpack import composed_ref
from utils import load_json, save_json, unwrap_value

logger = logging.getLogger("converter")

_TEXTJOIN_RE = re.compile(r"\{TEXTJOIN#(\d+)\}")

# 两种占位符形态，**带标签的写在左边**（同一位置上按分支顺序取首个匹配，与前端
# `fmtDesc` 的两条正则同序，见 src/lib/format.ts:76-78）。
# 三种前置断言挡同形前缀，互不重叠。实测 1950 条成就模板里：`<color=#` 357 处、
# `{TEXTJOIN#N}` 15 处（两者是断言真正要挡的对象），`<=#N` / `>=#N` 与 `##` 均 0 处。
# ① `(?<!TEXTJOIN)` 挡 `{TEXTJOIN#87}` 这类合并标记——**只挡这一个词**。
#    曾写成 `(?<![A-Za-z0-9_#])`「挡所有紧跟的 ASCII 字母数字」，但那条**过宽**：外文译文会把
#    占位符贴在词尾字母后（fr `dés temporels#2` / `Faveur x#1`、id `mengalahkan#1`），实测
#    3 处因此不展开、原样上屏进可索引快照；中文模板里前置总是汉字/CJK 标点，故 cn 侧一条不露。
#    **不能用 `\w`**——它含 CJK，会把紧随汉字的占位符一并挡掉（221 条真裸占位符的 233 处
#    `#` 里 229 处前面就是汉字）。
# ② `(?<![^<>]=)` 挡 `<color=#8790abff>` 这类颜色码（357 处 `=#` **全部**是 `<color=#`，标签外
#    `=#` 0 处）；只挡「非 `<`/`>` 再跟 `=`」的形态，故 `<=#2` / `>=#2` 这类比较符后的占位符
#    仍可展开（该形态当前语料 0 处，属**防御**：`<=#2` 只存在于 TextMap 另两个未被引用的 key）。
# ③ `(?<!#)` 挡 `##`（当前语料 0 处，同为**防御**）。
# 收窄前后的差集实测（13 语言语言包）：**新展开 3 条 / 反向损失 0 条**。
# 走 `_desc_text` 时颜色码已被 `clean_text` 剥掉、TEXTJOIN 也已在上一行展开，断言因此是兜底：
# 它保的是「未解析成功的 `{TEXTJOIN#N}` 与直接调本函数的调用方」不被改写成参数值。
# 裸形态**不吃**尾部 `%`：该 `%` 是模板里的字面字符（前端同样只传 `pct=''`，见 :78），
# 故裸 `#N%` **不做 ×100**——实测 6 条此类模板的参数本就是百分数（5 / 50 / 100 / 200 / 66 / 64,68）；
# ×100 只发生在**带标签**的 `#N[i]%`（实测 5 个比率参数 0.05 / 0.01 全部走这一形态）。
# 标签收 `[^\]]*`（含空标签）而非 `[a-z0-9]+`，与前端 :76 一致。
_PARAM_RE = re.compile(
    r"#(?P<tagged>\d+)\[(?P<tag>[^\]]*)\](?P<pct>%?)|(?<!TEXTJOIN)(?<![^<>]=)(?<!#)#(?P<bare>\d+)",
)

def _load_textjoin() -> dict[int, str]:
    """构建 TEXTJOIN 索引：TextJoinID → DefaultItem 的 **TextMap 键**。

    仅取 DefaultItem（默认形态），TextJoinItemList 的其他形态（性别/命名等变体）省略。
    存**键而非文本**：简介是「模板 + 参数」的组合文案，必须按语言各自组合（见 textpack 的
    `composed_ref`）——先解析成文本再组合，多语言下就只会得到中文那一份。
    """
    config = load_json(EXCEL_DIR / "TextJoinConfig.json")
    items = load_json(EXCEL_DIR / "TextJoinItem.json")
    item_key: dict[int, str] = {}
    for it in items:
        iid = it.get("TextJoinItemID")
        if iid is None:
            continue
        key = text_key_of(it.get("TextJoinText", {}))
        if key:
            item_key[iid] = key
    out: dict[int, str] = {}
    for c in config:
        tid = c.get("TextJoinID")
        default = c.get("DefaultItem")
        if tid is None or default is None:
            continue
        key = item_key.get(default)
        if key:
            out[tid] = key
    return out

def _expand_textjoin(text: str, tm: Mapping[str, str], textjoin: dict[int, str]) -> str:
    """用**指定语言**的文本表替换 {TEXTJOIN#id}；无对应配置时保留原占位符。"""

    def _replace(m: "re.Match[str]") -> str:
        key = textjoin.get(int(m.group(1)))
        if not key:
            return m.group(0)
        got = tm.get(key, "")
        return clean_text(got, dict(tm)) if got else m.group(0)

    return _TEXTJOIN_RE.sub(_replace, text)

_F_RANK_RE = re.compile(r"f([1-6])")

def _js_round(n: float) -> int:
    """JS `Math.round` 语义（半值向 +∞）。

    Python `round()` 是 banker's rounding（`round(0.5) == 0`），与前端 `fmtVal` 的 `Math.round`
    （`Math.round(0.5) === 1`）在 .5 处逐值不同，故不能直接用。负数也对齐：
    `Math.round(-1.5) === -1`、`Math.round(-2.5) === -2`。
    """
    return math.floor(n + 0.5)

def _js_num_str(n: float) -> str:
    """数值 → JS `String(n)` 形态：整值不带小数点（`String(50.0) === '50'`，Python `str` 给 `50.0`）。"""
    if isinstance(n, int):
        return str(n)
    return str(int(n)) if n.is_integer() else str(n)

def _fmt_val(val: Any, tag: str, is_pct: bool) -> str:
    """数值 + 标签 → 展示字符串，对齐前端 `fmtVal`（src/lib/format.ts:13-24）。

    `bool` 先归 `int`：Python `str(True)` 是 `'True'`，而 JS 里 `true` 参与算术得 `1`。
    """
    if isinstance(val, bool):
        val = int(val)
    if not isinstance(val, (int, float)):
        return str(val)
    n = val * 100 if is_pct else val
    if tag == "i":
        return _js_num_str(_js_round(n))
    rank = _F_RANK_RE.fullmatch(tag)
    if rank:
        f = 10 ** int(rank.group(1))
        return _js_num_str(_js_round(n * f) / f)
    return _js_num_str(n)

def _fill_params(text: str, param_list: list) -> str:
    """替换 `#n[tag]%` 与**裸** `#n` 占位符为 ParamList[n-1] 的展示值。

    数值格式化对齐前端 `fmtVal`（src/lib/format.ts:13-24）：`%` ⇒ 先 ×100、tag `i` ⇒ 半值向上
    取整、`f1`–`f6` ⇒ 定点舍入；非数值参数原样输出。
    **裸形态不消费尾部 `%`**（那是模板里的字面字符，与前端 :78 传 `pct=''` 一致）⇒ 不做 ×100。
    参数缺失（列表越界 / 值为空）时保留原占位符，避免丢失信息。
    """

    def _replace(m: "re.Match[str]") -> str:
        if m.group("bare") is not None:
            idx = int(m.group("bare")) - 1
            tag, suffix, is_pct = "", "", False
        else:
            idx = int(m.group("tagged")) - 1
            tag = m.group("tag")
            suffix = m.group("pct")
            is_pct = suffix == "%"
        if idx < 0 or idx >= len(param_list):
            return m.group(0)
        val = param_list[idx]
        if val is None:
            return m.group(0)
        return f"{_fmt_val(val, tag, is_pct)}{suffix}"

    return _PARAM_RE.sub(_replace, text)

def _desc_text(tm: Mapping[str, str], desc_key: str | None, param_list: list, textjoin: dict[int, str]) -> str:
    """**语言无关**的简介组合实现：模板 → TEXTJOIN 展开 → 参数替换 → 字面 \\n 转真实换行。

    缺省语言正文与各语言语言包都走这一份实现（`tm` 决定语言），不存在第二份组合逻辑。
    """
    text = clean_text(tm.get(desc_key, ""), dict(tm)) if desc_key else ""
    text = _expand_textjoin(text, tm, textjoin)
    text = _fill_params(text, [unwrap_value(p) for p in param_list])
    return text.replace(r"\n", "\n")

def _desc_ref(item: dict, textjoin: dict[int, str]) -> Any:
    """成就简介 → 组合文本引用（语言包按语言现算，前端与快照生成器零改动）。"""
    desc_ref = item.get("AchievementDesc", {})
    desc_key = text_key_of(desc_ref)
    param_list = item.get("ParamList", []) or []
    composer = lambda tm: _desc_text(tm, desc_key, param_list, textjoin)  # noqa: E731
    cn_text = _desc_text(current_textmap(), desc_key, param_list, textjoin)
    # 键里带参数签名：同一模板 + 不同参数是不同文案，必须各自缓存
    sig = hashlib.sha1(
        json.dumps(
            [unwrap_value(p) for p in param_list], ensure_ascii=False, separators=(",", ":"),
        ).encode("utf-8"),
    ).hexdigest()[:12]
    return composed_ref(f"composed:ach:{desc_key or 'lit'}:{sig}", composer, cn_text)

def _parse_achievement(item: dict, textjoin: dict[int, str]) -> dict:
    """单条成就记录 → achievements.json 条目。"""
    title = resolve_text(item.get("AchievementTitle", {}))
    desc = _desc_ref(item, textjoin)
    return {
        "id": item.get("AchievementID", 0),
        "title": title,
        "desc": desc,
        "rarity": item.get("Rarity", ""),
        "series_id": item.get("SeriesID", 0),
        "priority": item.get("Priority", 0),
        "show_type": item.get("ShowType") or "",
    }

def _series_icon(icon_path: str) -> str:
    """系列图标路径 → CDN 文件名（去扩展名）。

    SpriteOutput/Achievement/CultivateAchievementIcon_s.png → CultivateAchievementIcon_s
    """
    if not icon_path:
        return ""
    return Path(icon_path).stem

def _parse_series(item: dict) -> dict:
    """单条系列记录 → achievement_series.json 条目。"""
    return {
        "id": item.get("SeriesID", 0),
        "name": resolve_text(item.get("SeriesTitle", {})),
        "icon": _series_icon(item.get("MainIconPath", "")),
        "icon_s": _series_icon(item.get("IconPath", "")),
        "priority": item.get("Priority", 0),
    }

def convert() -> None:
    """转换成就数据 → achievements.json + achievement_series.json。"""
    textjoin = _load_textjoin()

    series_data = load_json(EXCEL_DIR / "AchievementSeries.json")
    series = [_parse_series(s) for s in series_data]
    series.sort(key=lambda s: s["priority"])
    series_by_id = {s["id"]: s for s in series}
    save_json(series, OUTPUT_DIR / "achievement_series.json")

    ach_data = load_json(EXCEL_DIR / "AchievementData.json")
    achievements = [_parse_achievement(a, textjoin) for a in ach_data]
    achievements.sort(key=lambda a: (
        series_by_id.get(a["series_id"], {}).get("priority", 999),
        -a["priority"],
    ))
    save_json(achievements, OUTPUT_DIR / "achievements.json")

    logger.info("成就转换完成：%d 条成就 / %d 个系列", len(achievements), len(series))