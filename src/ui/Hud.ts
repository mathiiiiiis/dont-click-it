import type { GameState } from '../game/types';

export class Hud {
  constructor(
    private readonly roundEl: HTMLElement,
    private readonly scoreEl: HTMLElement,
    private readonly livesEl: HTMLElement,
  ) {}

  update(state: Readonly<GameState>): void {
    this.roundEl.textContent = state.round > 0 ? String(state.round) : '\u2014';
    this.scoreEl.textContent = String(state.score);
    this.livesEl.textContent = String(state.lives);
  }
}
