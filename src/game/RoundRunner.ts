import type { Round, ActionResult } from './types';
import type { Narrator } from '../ui/Narrator';
import type { BigButton } from '../ui/BigButton';
import type { TimerBar } from '../ui/TimerBar';
import type { SoundBank } from '../audio/SoundBank';
import { sleep, ignoreAbort } from '../util/async';

export type RunnerDeps = {
  narrator: Narrator;
  button: BigButton;
  timer: TimerBar;
  soundBank: SoundBank;
};

export async function runRound(
  round: Round,
  deps: RunnerDeps,
  signal: AbortSignal,
): Promise<ActionResult> {
  const { narrator, button, timer, soundBank } = deps;

  const roundCtl = new AbortController();
  const roundSignal = AbortSignal.any([signal, roundCtl.signal]);

  try {
    button.setLabel(round.buttonLabel ?? "Don't click");
    timer.reset();

    const voice = round.voice ?? 'narrator';

    if (round.intro === null) narrator.silent();
    else narrator.say(round.intro, voice);

    const appearDelay = round.intro === null ? 500 : 650;
    await sleep(appearDelay, roundSignal);

    button.show();

    scheduleReveals(round, narrator, roundSignal);
    timer.run(round.duration);

    const result = await Promise.race<ActionResult>([
      button.nextClick(roundSignal),
      sleep(round.duration, roundSignal).then(() => 'timeout' as const),
    ]);

    if (result === 'clicked') soundBank.play('click');
    return result;
  } finally {
    roundCtl.abort();
    timer.reset();
    button.hide();
  }
}

function scheduleReveals(round: Round, narrator: Narrator, signal: AbortSignal): void {
  if (!round.reveals) return;
  const defaultVoice = round.voice ?? 'narrator';
  for (const reveal of round.reveals) {
    sleep(reveal.at, signal)
      .then(() => {
        if (signal.aborted) return;
        narrator.interrupt(reveal.text, reveal.voice ?? defaultVoice);
      })
      .catch(ignoreAbort);
  }
}
