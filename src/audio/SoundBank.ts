export type SoundId = 'click' | 'correct' | 'wrong' | 'appear' | 'drone';

const SOURCES: Record<SoundId, string> = {
  click: 'sounds/click.mp3',
  correct: 'sounds/correct.mp3',
  wrong: 'sounds/wrong.mp3',
  appear: 'sounds/appear.mp3',
  drone: 'sounds/drone.mp3',
};

export class SoundBank {
  private cache = new Map<SoundId, HTMLAudioElement>();
  private droneEl: HTMLAudioElement | null = null;
  private droneActive = false;
  private enabled = true;
  private sfxVolume = 0.5;
  private droneVolume = 0.067;

  preload(): void {
    for (const id of Object.keys(SOURCES) as SoundId[]) {
      const audio = new Audio(SOURCES[id]);
      audio.preload = 'auto';
      this.cache.set(id, audio);
    }
    const el = this.cache.get('drone');
    if (el) {
      this.droneEl = el;
      this.droneEl.loop = true;
      this.droneEl.volume = this.droneVolume;
    }
  }

  play(id: SoundId): void {
    if (!this.enabled || id === 'drone') return;
    const cached = this.cache.get(id);
    if (!cached) return;
    const clone = cached.cloneNode() as HTMLAudioElement;
    clone.volume = this.sfxVolume;
    clone.play().catch(() => {});
  }

  startDrone(): void {
    this.droneActive = true;
    if (!this.enabled || !this.droneEl) return;
    this.droneEl.play().catch(() => {});
  }

  stopDrone(): void {
    this.droneActive = false;
    if (!this.droneEl) return;
    this.droneEl.pause();
    this.droneEl.currentTime = 0;
  }

  setSfxVolume(v: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, v));
  }

  setDroneVolume(v: number): void {
    this.droneVolume = Math.max(0, Math.min(1, v));
    if (this.droneEl) this.droneEl.volume = this.droneVolume;
  }

  getSfxVolume(): number { return this.sfxVolume; }
  getDroneVolume(): number { return this.droneVolume; }

  mute(): void {
    this.enabled = false;
    this.droneEl?.pause();
  }

  unmute(): void {
    this.enabled = true;
    if (this.droneActive) this.droneEl?.play().catch(() => {});
  }
}
