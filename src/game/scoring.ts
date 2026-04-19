import type { Round, ActionResult, Outcome } from './types';

export function scoreAction(round: Round, action: ActionResult): Outcome {
  if (action === 'clicked') {
    return round.shouldClick ? 'correct' : 'wrong';
  }
  return round.shouldClick ? 'wrong' : 'correct';
}

export function pickRandom<T>(items: readonly T[]): T {
  if (items.length === 0) throw new Error('Cannot pick from empty array');
  return items[Math.floor(Math.random() * items.length)];
}

export function pickWeighted<T extends { weight?: number }>(items: readonly T[]): T {
  if (items.length === 0) throw new Error('Cannot pick from empty array');
  const total = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight ?? 1;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}
