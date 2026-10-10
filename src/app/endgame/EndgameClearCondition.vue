<script setup lang="ts">
import { translate } from '../i18n';

/** 模板统一走词典 */
const t = translate;
/** 面板顶部奖励板左栏（层 tab / 星启看板共用）：「通关条件」。
 *
 *  只渲染**数据里有的门槛**（值 + 口径标签，与「赛季规则」同一套 HUD 语言）：
 *  - 回合上限（`ChallengeCountDown`，`TurnLimit`）：超过即挑战失败，官方说明「在指定轮次内通关并达成
 *    特定条件可获得额外奖励」——忘却之庭层板 / 星启板取它；
 *  - 通关分数线（`ClearScore` / 星启关的 `ClearScore`）：虚构叙事层板 30000、星启板 45000 一类；
 *  - 两者都没有时退到数据派生的条数判据（末日幻影层板＝该难度场次数「击败首领」、星启板＝节点数
 *    「通关节点」）——末日幻影与异相仲裁的官方判据是「击败 N 个首领 / 完成关卡」，无数值门槛。
 *  数值一律由调用方从产物取，本组件不做模式分支。 */
defineProps<{ rows: { value: string; label: string }[] }>();
</script>

<template>
  <div class="nk-egd-head__col nk-egd-clear">
    <span class="nk-egd-head__label">{{ t('egd.clearCondition') }}</span>
    <span v-for="r in rows" :key="r.label" class="nk-egd-rules__item">
      <span class="nk-egd-rules__val">{{ r.value }}</span>
      <span class="nk-egd-rules__label">{{ r.label }}</span>
    </span>
  </div>
</template>
