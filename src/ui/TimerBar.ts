export class TimerBar {
  constructor(private readonly el: HTMLElement) {}

  run(durationMs: number): void {
    this.el.style.transition = 'none';
    this.el.style.transform = 'scaleX(1)';
    void this.el.offsetWidth;
    this.el.style.transition = `transform ${durationMs}ms linear`;
    this.el.style.transform = 'scaleX(0)';
  }

  reset(): void {
    this.el.style.transition = 'none';
    this.el.style.transform = 'scaleX(0)';
  }
}
