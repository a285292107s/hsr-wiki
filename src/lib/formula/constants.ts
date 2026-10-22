export const DEF_LEVEL_BASE = 200;
export const DEF_LEVEL_STEP = 10;
export const SWARM_DEF_LEVEL_BASE = 300;
export const SWARM_DEF_LEVEL_STEP = 15;
export const ACTION_VALUE_BASE = 10000;
export const FIRST_CYCLE_ACTION_VALUE = 150;
export const CYCLE_ACTION_VALUE = 100;
export const VULNERABILITY_CAP = 3.5;
export const DMG_REDUCTION_CAP = 0.99;
export const WEAKNESS_FLOOR = 0.2;
export const RES_MIN = -1;
export const RES_MAX = 0.9;
export const TOUGHNESS_DMG_REDUCTION = 0.1;
export const TRACE_TIERS = { high: 7, mid: 4.5, low: 2.5 } as const;
export const BREAK_ELEMENT_MULTIPLIER = {
  Physical: 2,
  Fire: 2,
  Wind: 1.5,
  Ice: 1,
  Thunder: 1,
  Quantum: 0.5,
  Imaginary: 0.5,
} as const;
export const BREAK_LENGTH_OFFSET = 2;
export const BREAK_LENGTH_DIVISOR = 4;
export const TOUGHNESS_UNIT = 10;
export const SUPER_BREAK_BASE_DIVISOR = 10;
export const ELATION_JOKE_OFFSET = 2;
export const ELATION_JOKE_SPAN = 242;
export const ELATION_JOKE_SLOPE = 2;
