export type FlashKind = 'good' | 'bad';

export class Flash {
  private timer: number | null = null;

  constructor(private readonly el: HTMLElement) {}

  show(text: string, kind: FlashKind): void {
    this.el.textContent = text;
    this.el.className = `flash ${kind} show`;
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => {
      this.el.classList.remove('show');
      this.timer = null;
    }, 900);
  }
}
