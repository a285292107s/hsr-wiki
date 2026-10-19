import { computed } from 'vue';
import { buildCompare } from '../../lib/compare';
import { gameTagsToHtml } from '../../lib/format';
import { useCharacterStore } from '../stores/character';
import { translate } from '../i18n';

export type FormMode = 'base' | 'enhanced' | 'compare';

export interface FormCard {
  mode: FormMode;
  key: string | null;
  label: string;
  note: string;
}

export function useEnhancedForm() {
  const char = useCharacterStore();
  const t = translate;

  const activeKey = computed<string | null>(
    () => char.enhKey || char.enhKeys[char.enhKeys.length - 1] || null,
  );

  const activeEnh = computed(() => {
    const pack = char.data && char.data.enhanced;
    const key = activeKey.value;
    return pack && key ? pack[key] || null : null;
  });

  const mode = computed<FormMode>(() => {
    if (char.compareOn) return 'compare';
    return char.enhKey ? 'enhanced' : 'base';
  });

  const forms = computed<FormCard[]>(() => [
    { mode: 'base', key: null, label: t('char.state.original'), note: 'BASE' },
    ...char.enhKeys.map((k) => ({
      mode: 'enhanced' as FormMode,
      key: k,
      label: t('cmp.enhanced'),
      note: `V${k}`,
    })),
    { mode: 'compare' as FormMode, key: null, label: t('char.state.compare'), note: 'DIFF' },
  ]);

  const notes = computed<string[]>(() => {
    if (mode.value === 'base') return [];
    return ((activeEnh.value && activeEnh.value.descs) || []).map((d) => gameTagsToHtml(d));
  });

  const changedCount = computed<number>(() => {
    if (!char.data || !activeKey.value) return 0;
    const diff = buildCompare(char.data, activeKey.value);
    return diff.skills.length + diff.ranks.length + diff.trees.length + (diff.spChanged ? 1 : 0);
  });

  function pick(m: FormMode, key?: string | null): void {
    if (m === 'compare') {
      char.setCompareOn(true);
      return;
    }
    char.setEnhKey(m === 'base' ? null : key ?? activeKey.value);
  }

  return { mode, forms, activeKey, activeEnh, notes, changedCount, pick };
}
