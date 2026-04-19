const KEY = 'dci-best';

export function loadBest(): number {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return 0;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

export function saveBest(score: number): number {
  const prev = loadBest();
  const best = Math.max(prev, score);
  try {
    localStorage.setItem(KEY, String(best));
  } catch {
    //quota or private mode
  }
  return best;
}
