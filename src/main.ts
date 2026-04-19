import './style.css';
import { GameController } from './game/GameController';
import { rounds } from './content/rounds';
import { BigButton } from './ui/BigButton';
import { Narrator } from './ui/Narrator';
import { Hud } from './ui/Hud';
import { Flash } from './ui/Flash';
import { TimerBar } from './ui/TimerBar';
import { WobbleAnimator } from './ui/WobbleAnimator';
import { VoiceSynth } from './audio/VoiceSynth';
import { SoundBank } from './audio/SoundBank';

function qs<T extends Element>(selector: string): T {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Missing element: ${selector}`);
  return el as T;
}

const synth = new VoiceSynth();
const soundBank = new SoundBank();
soundBank.preload();

const narrator = new Narrator(qs<HTMLElement>('[data-narrator]'), synth);
const button = new BigButton(
  qs<HTMLElement>('[data-button]'),
  qs<HTMLElement>('[data-button-label]'),
  qs<HTMLElement>('[data-play-area]'),
);
const timer = new TimerBar(qs<HTMLElement>('[data-timer]'));
const flash = new Flash(qs<HTMLElement>('[data-flash]'));
const hud = new Hud(
  qs<HTMLElement>('[data-hud="round"]'),
  qs<HTMLElement>('[data-hud="score"]'),
  qs<HTMLElement>('[data-hud="lives"]'),
);

const controller = new GameController({ rounds, narrator, button, timer, hud, flash, soundBank });

const turbs = Array.from(
  document.querySelectorAll<SVGFETurbulenceElement>('feTurbulence[data-turb]'),
);
const wobble = new WobbleAnimator(turbs, 180);
wobble.start();

const startBtn = qs<HTMLButtonElement>('[data-start]');
startBtn.addEventListener('click', async () => {
  synth.resume();
  startBtn.classList.add('hidden');
  await controller.start();
  startBtn.textContent = 'Play again';
  startBtn.classList.remove('hidden');
});

const muteBtn = qs<HTMLButtonElement>('[data-mute]');
const muteOn = qs<SVGElement>('[data-mute-on]');
const muteOff = qs<SVGElement>('[data-mute-off]');

muteBtn.addEventListener('click', () => {
  if (synth.isEnabled()) {
    synth.mute();
    soundBank.mute();
    muteOn.classList.add('hidden');
    muteOff.classList.remove('hidden');
  } else {
    synth.unmute();
    soundBank.unmute();
    muteOn.classList.remove('hidden');
    muteOff.classList.add('hidden');
  }
});
