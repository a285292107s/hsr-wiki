import { translate } from '../i18n';
import { mergeStarTierRuns, starTierRows, type StarTierRow } from './renders';
import { fmtNumber } from '../../lib/format';
import type {
  MazeFloorDetail, MazeListEntry, MazeRewardItem, MazeTargetInfo, PeakLevelInfo,
} from '../../services/types';

export interface SeasonRewardRule {
  value: string;
  label: string;
}

export interface SeasonRewardGroup {
  key: string;
  label: string;
  rules: SeasonRewardRule[];
  items: MazeRewardItem[];
  rows: StarTierRow[];
}

export interface SeasonRewardPlan {
  uniform: boolean;
  groups: SeasonRewardGroup[];
  floorFrom?: number;
  floorTo?: number;
  clear?: { rules: SeasonRewardRule[]; items: MazeRewardItem[] };
  conditions?: MazeTargetInfo[];
  ladder?: StarTierRow[];
  tierce?: SeasonRewardGroup | null;
}

function tierRows(...args: Parameters<typeof starTierRows>): StarTierRow[] {
  return mergeStarTierRuns(starTierRows(...args));
}

function floorStages(floor: MazeFloorDetail): number {
  return [floor.stage1, floor.stage2].filter(
    (stage) => !!stage && (!!stage.monsters?.length || !!stage.damage?.length),
  ).length;
}

function floorRules(data: MazeListEntry, floor: MazeFloorDetail): SeasonRewardRule[] {
  const rules: SeasonRewardRule[] = [];
  if (data.clear_score) {
    rules.push({ value: fmtNumber(data.clear_score), label: translate('egd.rule.score') });
  }
  const countdown = floor.countdown || data.countdown || 0;
  if (countdown) rules.push({ value: String(countdown), label: translate('egd.rule.cyclesCap') });
  if (!rules.length) {
    const stages = floorStages(floor);
    if (stages) rules.push({ value: String(stages), label: translate('egd.rule.enemies') });
  }
  return rules;
}

function tierceRules(data: MazeListEntry): SeasonRewardRule[] {
  const tierce = data.tierce;
  if (!tierce) return [];
  const rules: SeasonRewardRule[] = [];
  if (tierce.score) rules.push({ value: fmtNumber(tierce.score), label: translate('egd.rule.score') });
  if (tierce.countdown) rules.push({ value: String(tierce.countdown), label: translate('egd.rule.cyclesCap') });
  if (!rules.length && tierce.nodes?.length) {
    rules.push({ value: String(tierce.nodes.length), label: translate('egd.rule.nodes') });
  }
  return rules;
}

function levelLabel(level: PeakLevelInfo, index: number): string {
  return level.name || translate('egd.levelLabel', { n: index });
}

export function seasonRewardGroups(data: MazeListEntry): SeasonRewardGroup[] {
  const groups: SeasonRewardGroup[] = [];
  const floors = [...(data.floor_details || [])].sort((a, b) => a.floor - b.floor);
  for (const floor of floors) {
    const items = floor.reward || [];
    const rows = tierRows(floor.targets || [], floor.star_rewards || []);
    if (!items.length && !rows.length) continue;
    groups.push({
      key: `floor-${floor.floor}`,
      label: translate('egd.floorLabel', { n: floor.floor }),
      rules: floorRules(data, floor),
      items,
      rows,
    });
  }
  if (data.tierce) {
    const targets = data.tierce.targets || [];
    const lastFloor = floors[floors.length - 1];
    const rows = tierRows(
      targets.filter((t) => !t.prism),
      lastFloor?.star_rewards || [],
      {
        target: targets.find((t) => t.prism) || null,
        items: data.tierce.prism_reward || [],
      },
    );
    if (rows.length || (data.tierce.rewards || []).length) {
      groups.push({
        key: 'tierce',
        label: translate('egm.stat.tierce'),
        rules: tierceRules(data),
        items: data.tierce.rewards || [],
        rows,
      });
    }
  }
  const levels = data.levels || [];
  if (levels.length) {
    const knights = levels.filter((lv) => lv.kind === 'knight');
    const king = levels.find((lv) => lv.kind === 'king');
    const ordered = [...knights, ...(king ? [king] : [])];
    ordered.forEach((level, index) => {
      const rows = tierRows(level.targets || [], level.star_rewards || []);
      if (!rows.length) return;
      groups.push({
        key: `${level.kind}-${level.id ?? index}`,
        label: levelLabel(level, index + 1),
        rules: [],
        items: [],
        rows,
      });
    });
    if (king?.hard) {
      const rows = tierRows(king.hard.targets || [], king.hard.star_rewards || []);
      if (rows.length) {
        groups.push({
          key: `king-${king.id ?? 'hard'}-hard`,
          label: king.hard.name || translate('egd.peak.hardDiff'),
          rules: [],
          items: [],
          rows,
        });
      }
    }
  }
  return groups;
}

function rewardSignature(items: MazeRewardItem[] | undefined): string {
  const rows = (items || []).map((item): [number, number | null] => [item.id, item.num ?? null]);
  return JSON.stringify(rows.sort((a, b) => a[0] - b[0]));
}

function targetSignature(targets: MazeTargetInfo[] | undefined): string {
  return JSON.stringify((targets || []).map((target) => [target.type ?? '', target.param ?? null]));
}

function uniformFloors(data: MazeListEntry, floors: MazeFloorDetail[]): boolean {
  if (floors.length < 2 || !(data.star_rewards || []).length) return false;
  const first = floors[0];
  const signature = {
    reward: rewardSignature(first.reward),
    rules: JSON.stringify(floorRules(data, first)),
    targets: targetSignature(first.targets),
  };
  return floors.every((floor) => rewardSignature(floor.reward) === signature.reward
    && JSON.stringify(floorRules(data, floor)) === signature.rules
    && targetSignature(floor.targets) === signature.targets);
}

export function seasonRewardPlan(data: MazeListEntry): SeasonRewardPlan {
  const groups = seasonRewardGroups(data);
  const floors = [...(data.floor_details || [])].sort((a, b) => a.floor - b.floor);
  const floorGroups = groups.filter((group) => group.key.startsWith('floor-'));
  const tierce = groups.find((group) => group.key === 'tierce') || null;
  const uniform = floors.length > 1
    && floorGroups.length === floors.length
    && uniformFloors(data, floors);
  if (!uniform) return { uniform: false, groups };
  const first = floors[0];
  return {
    uniform: true,
    groups: [],
    floorFrom: first.floor,
    floorTo: floors[floors.length - 1].floor,
    clear: { rules: floorRules(data, first), items: first.reward || [] },
    conditions: first.targets || [],
    ladder: tierRows([], data.star_rewards || []),
    tierce,
  };
}
