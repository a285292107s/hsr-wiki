<script setup lang="ts">
import { fmtDesc } from '../../lib/format';
import { bossTraitDescHtml } from './renders';
import type { MazeBossGuide } from '../../services/types';

import { translate } from '../i18n';

/** 模板与脚本统一走词典 */
const t = translate;
/** 敌方卡内的两个首领机制分区：首领特性（战斗机制条目）与阶段机制（阶段说明 + 官方应对策略 +
 *  小节问答）。归属由转换器算好——命中登记的敌方条目带 `boss_guide` 模板指针，正文在赛季级
 *  `boss_guides`（配置表的敌方 ID 未必等于战斗敌方，前端不推导模板）。
 *  两个分区各自成段（与卡内「技能」「召唤物」同一套发丝线语言），只有末日幻影的首领有，
 *  其余模式与杂兵缺省不渲染，零 modeKey 分支。 */
defineProps<{ guide: MazeBossGuide }>();
</script>

<template>
  <div v-if="guide.traits?.length" class="nk-egd-guide">
    <span class="nk-egd-guide__label">{{ t('egd.bossTraits') }}</span>
    <article v-for="t in guide.traits" :key="t.id" class="nk-egd-trait">
      <h4 class="nk-egd-trait__name">{{ t.name }}</h4>
      <p v-if="t.desc" class="nk-egd-trait__desc" v-html="bossTraitDescHtml(t)"></p>
    </article>
  </div>
  <div v-if="guide.phases?.length" class="nk-egd-phase">
    <span class="nk-egd-phase__label">{{ t('mob.sec.guide') }}</span>
    <article v-for="p in guide.phases" :key="p.id" class="nk-egd-phase__item">
      <h4 class="nk-egd-phase__name">{{ p.name }}</h4>
      <p v-if="p.desc" class="nk-egd-phase__desc" v-html="fmtDesc(p.desc, [])"></p>
      <p v-if="p.answer" class="nk-egd-phase__answer" v-html="fmtDesc(p.answer, [])"></p>
      <ul v-if="p.skills?.length" class="nk-egd-phase__skills">
        <li v-for="s in p.skills" :key="s.name" class="nk-egd-phase__skill">
          <span class="nk-egd-phase__skillname">{{ s.name }}</span>
          <span v-if="s.desc" class="nk-egd-phase__skilldesc" v-html="fmtDesc(s.desc, [])"></span>
        </li>
      </ul>
    </article>
  </div>
</template>
