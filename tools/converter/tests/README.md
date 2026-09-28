# converter 测试约定（单一事实源，禁止在各测试文件重复注释）

## 运行

```bash
cd tools/converter
python -m pytest tests/ -v
```

## sys.path 装配（禁止在测试文件内重复写注释）

每个测试文件顶部需把 converter 根目录加入 `sys.path`（否则 `import converters` / `import query`
失败）。统一写法（代码本身即可，无需注释解释）：

```python
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
```

## 数据边界

`vendor/TurnBasedGameData` 禁止直接读取或写入；数据探索走 `query.py` / `DATA_CATALOG.md`，
转换走 `convert.py`。测试一律用合成数据，不依赖真实源数据。
