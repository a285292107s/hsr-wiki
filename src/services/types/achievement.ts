/**
 * 成就数据（converter 输出 achievements.json / achievement_series.json）
 *
 * 数据来源：vendor/TurnBasedGameData → AchievementData.json / AchievementSeries.json
 * 转换器：tools/converter/converters/achievements.py
 * - rarity：Low（铜）/ Mid（银）/ High（金）——游戏内稀有度徽章
 * - show_type：''（常显）/ ShowAfterFinish（完成后显示）/ HiddenDesc（隐藏描述）
 * - desc：已展开 {TEXTJOIN#id} 与 #n[i] 参数，字面 \n 已转真实换行（前端 pre-line 渲染）
 */
export interface AchievementItem {
  id: number;
  title: string;
  desc: string;
  rarity: 'Low' | 'Mid' | 'High' | '';
  series_id: number;
  priority: number;
  show_type: '' | 'ShowAfterFinish' | 'HiddenDesc';
}

export type AchievementList = AchievementItem[];

/** 成就系列（icon / icon_s 为 CDN 文件名，去扩展名，前端拼 achievement/{name}.webp） */
export interface AchievementSeries {
  id: number;
  name: string;
  icon: string;
  icon_s: string;
  priority: number;
}

export type AchievementSeriesList = AchievementSeries[];