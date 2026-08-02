"""增量依赖一致性测试。

核心保障：converters/<module>.py 中静态可见的源文件加载调用（load_json / _load_excel /
_maybe_load 且文件名是字面量）必须全部出现在 incremental.MODULE_SOURCES 的对应声明中。

否则该源文件变更时模块不会重跑，产生静默数据过期（历史事故：currency/character_detail/
monsters/endgame 的声明与实际读取曾长期漂移）。

运行: cd tools/converter && python -m pytest tests/ -v
"""

import ast
import sys
from pathlib import Path

# 确保 converter 根目录在 sys.path 中
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest  # noqa: E402

from incremental import MODULE_SOURCES  # noqa: E402

CONVERTERS_DIR = Path(__file__).resolve().parent.parent / "converters"

# 允许的加载调用形态：函数名 → 需要的参数形态（参数 0 为文件名）
_LOAD_CALL_NAMES = {"load_json", "_load_excel", "_maybe_load"}


def _extract_static_sources(path: Path) -> set[str]:
    """AST 提取文件中静态可见的源文件名（字面量参数）。"""
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    found: set[str] = set()
    for node in ast.walk(tree):
        if not isinstance(node, ast.Call):
            continue
        func = node.func
        name = None
        # load_json(EXCEL_DIR / "X.json")
        if isinstance(func, ast.Attribute) and isinstance(func.value, ast.Name):
            if func.value.id == "EXCEL_DIR" and func.attr == "load_json":
                name = "load_json"
        # _load_excel("X.json") / _maybe_load("X.json")
        elif isinstance(func, ast.Name) and func.id in _LOAD_CALL_NAMES:
            name = func.id
        if name is None:
            continue
        if not node.args:
            continue
        arg0 = node.args[0]
        # 字面量参数：直接取；BinaryOp (EXCEL_DIR / "X.json") 取右操作数
        if isinstance(arg0, ast.Constant) and isinstance(arg0.value, str):
            found.add(arg0.value)
        elif isinstance(arg0, ast.BinOp) and isinstance(arg0.right, ast.Constant):
            if isinstance(arg0.right.value, str):
                found.add(arg0.right.value)
    return found


def _module_files() -> list[Path]:
    return sorted(CONVERTERS_DIR.glob("*.py"))


@pytest.mark.parametrize(
    "conv_file",
    _module_files(),
    ids=[p.stem for p in _module_files()],
)
def test_module_sources_cover_static_loads(conv_file: Path) -> None:
    """代码中静态可见的加载调用必须被 MODULE_SOURCES 声明覆盖。"""
    module_name = conv_file.stem
    declared = set(MODULE_SOURCES.get(module_name, []))
    static = _extract_static_sources(conv_file)

    missing = static - declared
    assert not missing, (
        f"{module_name} 增量依赖声明缺少静态可见的源文件: {sorted(missing)}\n"
        f"请在 incremental.MODULE_SOURCES['{module_name}'] 中补充"
    )


def test_all_modules_declared() -> None:
    """convert.py 注册的所有模块都必须有 MODULE_SOURCES 声明（防新增模块漏配）。"""
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    import convert

    for module_name in convert.MODULES:
        assert module_name in MODULE_SOURCES, (
            f"模块 {module_name} 未在 incremental.MODULE_SOURCES 中声明依赖"
        )
