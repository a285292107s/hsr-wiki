"""light_cone_detail 转换器纯函数契约测试。

用合成数据验证（不依赖真实源数据）：
- _build_recommend_index：AvatarEquipRecommend(+LD) → 光锥 ID → 适配角色
  （rank 取角色推荐列表顺位、同 AvatarID 后写覆盖、按 (rank, id) 排序、无 ID 记录跳过）

"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from converters import light_cone_detail as lcd  # noqa: E402


class TestBuildRecommendIndex:
    def test_rank_follows_equipment_list_order(self):
        index = lcd._build_recommend_index([
            {"AvatarID": 1001, "EquipmentList": [21002, 23005, 24002]},
        ])
        assert index == {
            21002: [{"id": 1001, "rank": 1}],
            23005: [{"id": 1001, "rank": 2}],
            24002: [{"id": 1001, "rank": 3}],
        }

    def test_merges_avatars_and_sorts_by_rank_then_id(self):
        index = lcd._build_recommend_index([
            {"AvatarID": 1302, "EquipmentList": [21002, 23005]},
            {"AvatarID": 1001, "EquipmentList": [21002, 24002]},
            {"AvatarID": 1008, "EquipmentList": [21002]},
        ])
        assert index[21002] == [
            {"id": 1001, "rank": 1},
            {"id": 1008, "rank": 1},
            {"id": 1302, "rank": 1},
        ]
        assert index[23005] == [{"id": 1302, "rank": 2}]
        assert index[24002] == [{"id": 1001, "rank": 2}]

    def test_later_record_overrides_same_avatar(self):
        """LD 表后写：同一 AvatarID 重复登记时整表覆盖，不是并集。"""
        index = lcd._build_recommend_index([
            {"AvatarID": 1014, "EquipmentList": [21001]},
            {"AvatarID": 1014, "EquipmentList": [23045, 24000]},
        ])
        assert index == {
            23045: [{"id": 1014, "rank": 1}],
            24000: [{"id": 1014, "rank": 2}],
        }

    def test_skips_records_without_avatar_id_and_missing_list(self):
        index = lcd._build_recommend_index([
            {"EquipmentList": [21002]},
            {"AvatarID": 0, "EquipmentList": [21002]},
            {"AvatarID": 1001},
            {"AvatarID": 1002, "EquipmentList": []},
        ])
        assert index == {}

    def test_empty_input_returns_empty_index(self):
        assert lcd._build_recommend_index([]) == {}
