export class WobbleAnimator {
  private timer: number | null = null;

  constructor(
    private readonly turbElements: readonly SVGFETurbulenceElement[],
    private readonly intervalMs = 180,
  ) {}

  start(): void {
    if (this.timer !== null) return;
    this.tick();
    this.timer = window.setInterval(() => this.tick(), this.intervalMs);
  }

  stop(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  private tick(): void {
    for (const el of this.turbElements) {
      el.setAttribute('seed', String(Math.floor(Math.random() * 1000)));
    }
  }
}
