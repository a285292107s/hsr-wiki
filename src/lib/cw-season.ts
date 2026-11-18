const STORAGE_KEY = 'HSR_WIKI_CW_SEASON';

export const DEFAULT_CW_SEASON: number | null = null;

export function getSavedCwSeason(): number | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v == null || v === '') return null;
    const n = Number(v);
    return Number.isInteger(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

export function setSavedCwSeason(season: number | null): void {
  try {
    if (season == null) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, String(season));
  } catch {
    /* ignore */
  }
}
