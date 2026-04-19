export type VoiceId = 'narrator' | 'sly' | 'urgent' | 'button' | 'silent';

export type VoiceConfig = {
  type: OscillatorType;      // > square = bitcrushed, triangle = softer, sine = gentle
  base: number;              // > base frequency in Hz
  spread: number;            // > Hz added per character-code step
  volume: number;            // > 0 to 1, keep low to avoid earbleed
  envelope: number;          // > seconds for the exponential decay tail
};

export const VOICES: Record<VoiceId, VoiceConfig | null> = {
  narrator: { type: 'square',   base: 210, spread: 10, volume: 0.05, envelope: 0.06 },
  sly:      { type: 'triangle', base: 170, spread: 7,  volume: 0.07, envelope: 0.09 },
  urgent:   { type: 'square',   base: 260, spread: 14, volume: 0.06, envelope: 0.05 },
  button:   { type: 'sawtooth', base: 140, spread: 6,  volume: 0.04, envelope: 0.07 },
  silent:   null,
};

export class VoiceSynth {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volumeScale = 1;

  resume(): void {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  blip(char: string, voiceId: VoiceId): void {
    if (!this.enabled) return;
    const voice = VOICES[voiceId];
    if (!voice) return;
    if (!/[A-Za-z0-9]/.test(char)) return;
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    const code = char.toUpperCase().charCodeAt(0);
    const pitchMod = ((code - 65 + 18) % 18) * voice.spread;
    osc.frequency.value = voice.base + pitchMod;
    osc.type = voice.type;

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(voice.volume * this.volumeScale, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + voice.envelope);

    osc.start(now);
    osc.stop(now + voice.envelope + 0.02);
  }

  setVolumeScale(v: number): void { this.volumeScale = Math.max(0, Math.min(2, v)); }
  getVolumeScale(): number { return this.volumeScale; }
  mute(): void { this.enabled = false; }
  unmute(): void { this.enabled = true; }
  isEnabled(): boolean { return this.enabled; }
}
