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
  qs<HTMLElement>('[data-hud="streak"]'),
  qs<HTMLElement>('[data-hud="lives"]'),
  qs<HTMLElement>('[data-hud="best"]'),
);

const stageEl = qs<HTMLElement>('[data-stage]');

const controller = new GameController({ rounds, narrator, button, timer, hud, flash, soundBank, stageEl });

const turbs = Array.from(
  document.querySelectorAll<SVGFETurbulenceElement>('feTurbulence[data-turb]'),
);
const wobble = new WobbleAnimator(turbs, 180);
wobble.start();

let menuDroneRunning = false;

function startMenuDrone(): void {
  if (!controller.getState().playing && !menuDroneRunning) {
    menuDroneRunning = true;
    soundBank.startDrone();
  }
}

function stopMenuDrone(): void {
  if (menuDroneRunning) {
    menuDroneRunning = false;
    soundBank.stopDrone();
  }
}

const startBtn = qs<HTMLButtonElement>('[data-start]');
startBtn.addEventListener('click', async () => {
  synth.resume();
  stopMenuDrone();
  startBtn.classList.add('hidden');
  await controller.start();
  startBtn.textContent = 'Play again';
  startBtn.classList.remove('hidden');
  startMenuDrone();
});

const muteBtn = qs<HTMLButtonElement>('[data-mute]');
const muteOn = qs<SVGElement>('[data-mute-on]');
const muteOff = qs<SVGElement>('[data-mute-off]');

muteBtn.addEventListener('click', () => {
  synth.resume();
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
    if (!controller.getState().playing) startMenuDrone();
  }
});

//settings overlay
const settingsBtn = qs<HTMLButtonElement>('[data-settings-toggle]');
const settingsOverlay = qs<HTMLElement>('[data-settings]');

function openSettings(): void {
  synth.resume();
  stopMenuDrone();
  settingsOverlay.classList.remove('hidden');
}

function closeSettings(): void {
  settingsOverlay.classList.add('hidden');
  startMenuDrone();
}

settingsBtn.addEventListener('click', () => {
  if (settingsOverlay.classList.contains('hidden')) openSettings();
  else closeSettings();
});

document.querySelectorAll<HTMLElement>('[data-settings-close]').forEach((el) => {
  el.addEventListener('click', closeSettings);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsOverlay.classList.contains('hidden')) {
    closeSettings();
  }
});

//slider previews

const sfxPool = ['click', 'correct', 'wrong', 'appear'] as const;
let lastSfxPreview = 0;
function previewSfx(): void {
  const now = Date.now();
  if (now - lastSfxPreview < 250) return;
  lastSfxPreview = now;
  const id = sfxPool[Math.floor(Math.random() * sfxPool.length)];
  soundBank.play(id);
}

let dronePreviewTimer: number | null = null;
function previewDrone(): void {
  soundBank.startDrone();
  if (dronePreviewTimer !== null) clearTimeout(dronePreviewTimer);
  dronePreviewTimer = window.setTimeout(() => {
    soundBank.stopDrone();
    dronePreviewTimer = null;
  }, 500);
}

let lastVoicePreview = 0;
function previewVoice(): void {
  const now = Date.now();
  if (now - lastVoicePreview < 70) return;
  lastVoicePreview = now;
  const chars = 'THEQUICKBROWNFOX';
  synth.blip(chars[Math.floor(Math.random() * chars.length)], 'narrator');
}

function wireSlider(attr: string, onChange: (v: number) => void, onPreview?: () => void): void {
  const input = qs<HTMLInputElement>(`[data-slider="${attr}"]`);
  const valEl = qs<HTMLElement>(`[data-slider-val="${attr}"]`);
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    valEl.textContent = String(Math.round(v * 100));
    onChange(v);
    onPreview?.();
  });
}

wireSlider('sfx', (v) => soundBank.setSfxVolume(v), previewSfx);
wireSlider('drone', (v) => soundBank.setDroneVolume(v), previewDrone);
wireSlider('voice', (v) => synth.setVolumeScale(v), previewVoice);

//show saved high score on load
import { loadBest } from './util/highscore';
hud.setBest(loadBest());
