import type { VoiceSynth, VoiceId } from '../audio/VoiceSynth';
import { sleep } from '../util/async';

const SPEED: Record<VoiceId, number> = {
  narrator: 48,
  sly: 52,
  urgent: 32,
  button: 40,
  silent: 0,
};

export class Narrator {
  private abort: AbortController | null = null;
  private currentText = '';

  constructor(
    private readonly el: HTMLElement,
    private readonly synth: VoiceSynth,
  ) {}

  async say(text: string, voice: VoiceId = 'narrator'): Promise<void> {
    this.stop();
    this.abort = new AbortController();
    this.el.classList.remove('muted');
    this.currentText = '';
    this.el.textContent = '';

    if (voice === 'silent') {
      this.currentText = text;
      this.el.textContent = text;
      return;
    }

    await this.type(text, voice, this.abort.signal);
  }

  async append(text: string, voice: VoiceId = 'narrator'): Promise<void> {
    this.stop();
    this.abort = new AbortController();
    this.el.classList.remove('muted');

    await this.type(text, voice, this.abort.signal);
  }

  interrupt(text: string, voice: VoiceId = 'narrator'): void {
    void this.append(text, voice);
  }

  verdict(text: string, voice: VoiceId = 'narrator'): void {
    void this.say(text, voice);
  }

  silent(): void {
    this.stop();
    this.currentText = '';
    this.el.classList.add('muted');
    this.el.textContent = '...';
  }

  stop(): void {
    this.abort?.abort();
    this.abort = null;
  }

  private async type(text: string, voice: VoiceId, signal: AbortSignal): Promise<void> {
    const speed = SPEED[voice];
    try {
      for (let i = 0; i < text.length; i++) {
        if (signal.aborted) return;
        this.currentText += text[i];
        this.el.textContent = this.currentText;
        if (i % 2 === 0) this.synth.blip(text[i], voice);
        await sleep(speed, signal);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    }
  }
}
