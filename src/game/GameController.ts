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

export type ControllerDeps = {
  rounds: Round[];
  narrator: Narrator;
  button: BigButton;
  timer: TimerBar;
  hud: Hud;
  flash: Flash;
  soundBank: SoundBank;
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

  private async loop(): Promise<void> {
    if (!this.abort) return;

    while (this.state.playing && this.state.lives > 0) {
      this.state.round++;
      this.deps.hud.update(this.state);

      const round = this.pickRound();
      if (!round) throw new Error('No eligible rounds');
      this.lastId = round.id;

      const action = await runRound(round, this.deps, this.abort.signal);
      const outcome = scoreAction(round, action);
      this.recordEvent(round, action, outcome);

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
    this.state.score++;
    this.state.streak++;
    this.state.maxStreak = Math.max(this.state.maxStreak, this.state.streak);

    this.deps.hud.update(this.state);
    this.deps.flash.show('+1', 'good');
    this.deps.soundBank.play('correct');
    this.deps.narrator.verdict(pickRandom(round.good), round.voice ?? 'narrator');
  }

  private onWrong(round: Round): void {
    this.state.lives--;
    this.state.streak = 0;

    this.deps.hud.update(this.state);
    this.deps.flash.show('\u22121 life', 'bad');
    this.deps.soundBank.play('wrong');
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
    const verdict = this.finalVerdict();
    this.deps.narrator.verdict(
      `Game over. ${this.state.score} correct across ${this.state.round} rounds. ${verdict}`,
    );
  }

  private finalVerdict(): string {
    const s = this.state.score;
    if (s >= 12) return 'Frankly, suspicious.';
    if (s >= 8) return 'Respectable.';
    if (s >= 4) return 'Adequate.';
    return "We've all been there. Some of us more than others.";
  }
}
