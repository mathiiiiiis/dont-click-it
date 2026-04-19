import type { VoiceId } from '../audio/VoiceSynth';

export type RoundTag = 
  | 'flip' 
  | 'silent' 
  | 'misdirect' 
  | 'urgent' 
  | 'runner' 
  | 'logic' 
  | 'visual' 
  | 'meta' 
  | 'social' 
  | 'classic'
  | 'timing'
  | 'chaos'
  | 'mindgame';

export type Reveal = {
  at: number;
  text: string;
  voice?: VoiceId;
};

export type Round = {
  id: string;
  intro: string | null;
  reveals?: Reveal[];
  duration: number;
  shouldClick: boolean;
  buttonLabel?: string;
  runner?: boolean;
  good: string[];
  bad: string[];
  weight?: number;
  unlockAfter?: number;
  tags?: RoundTag[];
  voice?: VoiceId;
  allowLateClick?: boolean; // allow click after "correct window"
  instantFail?: boolean;    // fail immediately on wrong action
  hidden?: boolean;         // not shown in normal rotation
};

export type ActionResult = 'clicked' | 'timeout';

export type Outcome = 'correct' | 'wrong';

export type RoundEvent = {
  roundId: string;
  outcome: Outcome;
  action: ActionResult;
  tags: RoundTag[];
  reactionTime?: number;
  timestamp: number;
};

export type GameState = {
  round: number;
  score: number;
  lives: number;
  playing: boolean;
  history: RoundEvent[];
  streak: number;
  maxStreak: number;
};
