import type { Round, RoundEvent, GameState, ActionResult, Outcome } from './types';
import { pickWeighted, pickRandom, scoreAction } from './scoring';
import { runRound } from './RoundRunner';
import type { Narrator } from '../ui/Narrator';
import type { BigButton } from '../ui/BigButton';
import type { TimerBar } from '../ui/TimerBar';
import type { Hud } from '../ui/Hud';
import type { Flash } from '../ui/Flash';
import { sleep } from '../util/async';
import type { SoundBank } from '../audio/SoundBank';
import { loadBest, saveBest } from '../util/highscore';
import { shake } from '../ui/Shake';

export type ControllerDeps = {
  rounds: Round[];
  narrator: Narrator;
  button: BigButton;
  timer: TimerBar;
  hud: Hud;
  flash: Flash;
  soundBank: SoundBank;
  stageEl: HTMLElement;
};

export class GameController {
  private state: GameState = { 
    round: 0, 
    score: 0, 
    lives: 3, 
    playing: false, 
    history: [],
    streak: 0,
    maxStreak: 0,
  };
  private lastId: string | null = null;
  private abort: AbortController | null = null;

  constructor(private readonly deps: ControllerDeps) {}

  getState(): Readonly<GameState> {
    return this.state;
  }

  getLog(): readonly RoundEvent[] {
    return this.state.history;
  }

  async start(): Promise<void> {
    this.state = { 
      round: 0, 
      score: 0, 
      lives: 3, 
      playing: true, 
      history: [],
      streak: 0,
      maxStreak: 0,
    };
    this.lastId = null;
    this.abort = new AbortController();
    this.deps.hud.update(this.state);
    this.deps.hud.setBest(loadBest());
    this.deps.soundBank.startDrone();
    this.deps.narrator.say('There is a button. I will tell you what to do with it. Usually.');

    try {
      await sleep(3600, this.abort.signal);
      await this.loop();
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    }
  }

  stop(): void {
    this.state.playing = false;
    this.deps.soundBank.stopDrone();
    this.deps.button.hide();
    this.abort?.abort();
  }

  private difficultyScale = 1;
  setDifficulty(scale: number): void {
    this.difficultyScale = Math.max(0.1, scale);
  }

  private async loop(): Promise<void> {
    if (!this.abort) return;

    while (this.state.playing && this.state.lives > 0) {
      this.state.round++;
      this.deps.hud.update(this.state);

      const base = this.pickRound();
      if (!base) throw new Error('No eligible rounds');
      this.lastId = base.id;

      const baseScale = Math.max(0.55, 1 - this.state.round * 0.018);
      const scale = baseScale * this.difficultyScale;

      //scale duration, reveal timings, and narrator typing speed together
      const scaledReveals = base.reveals?.map((r) => ({
        ...r,
        at: Math.round(r.at * scale),
      }));
      const round: Round = {
        ...base,
        duration: Math.round(base.duration * scale),
        reveals: scaledReveals,
      };

      this.deps.narrator.setSpeedScale(scale);
      const action = await runRound(round, this.deps, this.abort.signal);
      const outcome = scoreAction(round, action);
      this.recordEvent(round, action, outcome);

      //reset narrator to normal speed
      this.deps.narrator.setSpeedScale(1);
      if (outcome === 'correct') this.onCorrect(round);
      else this.onWrong(round);

      await sleep(outcome === 'correct' ? 2400 : 2700, this.abort.signal);
    }

    if (this.state.lives <= 0) this.onGameOver();
  }

  private pickRound(): Round | null {
    const eligible = this.deps.rounds.filter((r) => {
      if (r.id === this.lastId) return false;
      if (r.unlockAfter !== undefined && this.state.round < r.unlockAfter) return false;
      return true;
    });
    if (eligible.length === 0) return null;
    return pickWeighted(eligible);
  }

  private onCorrect(round: Round): void {
    this.state.streak++;
    this.state.maxStreak = Math.max(this.state.maxStreak, this.state.streak);

    const mult = this.state.streak >= 10 ? 3 : this.state.streak >= 5 ? 2 : 1;
    this.state.score += mult;

    this.deps.hud.update(this.state);
    const label = mult > 1 ? `+${mult} combo!` : '+1';
    this.deps.flash.show(label, 'good');
    this.deps.soundBank.play('correct');
    this.deps.narrator.verdict(pickRandom(round.good), round.voice ?? 'narrator');
  }

  private onWrong(round: Round): void {
    this.state.lives--;
    this.state.streak = 0;

    this.deps.hud.update(this.state);
    this.deps.flash.show('\u22121 life', 'bad');
    this.deps.soundBank.play('wrong');
    shake(this.deps.stageEl);
    this.deps.narrator.verdict(pickRandom(round.bad), round.voice ?? 'narrator');
  }

  private recordEvent(round: Round, action: ActionResult, outcome: Outcome): void {
    const event: RoundEvent = {
      roundId: round.id,
      outcome,
      action,
      tags: round.tags ?? [],
      timestamp: Date.now(),
    };

    this.state.history.push(event);
  }

  private onGameOver(): void {
    this.state.playing = false;
    this.deps.soundBank.stopDrone();
    this.deps.button.hide();

    const best = saveBest(this.state.score);
    this.deps.hud.setBest(best);
    const isNew = this.state.score >= best && this.state.score > 0;

    const verdict = this.finalVerdict();
    const bestNote = isNew ? ' New record.' : '';
    this.deps.narrator.verdict(
      `Game over. ${this.state.score} points across ${this.state.round} rounds.${bestNote} ${verdict}`,
    );
  }

  private finalVerdict(): string {
    const s = this.state.score;
    if (s >= 30) return 'I refuse to believe this.';
    if (s >= 20) return 'Frankly, suspicious.';
    if (s >= 12) return 'Impressive.';
    if (s >= 8) return 'Respectable.';
    if (s >= 4) return 'Adequate.';
    return "We've all been there. Some of us more than others.";
  }
}
