export class BigButton {
  private runnerDodges = 0;
  private clickResolver: ((value: 'clicked') => void) | null = null;
  private onEnter: (() => void) | null = null;

  constructor(
    private readonly el: HTMLElement,
    private readonly labelEl: HTMLElement,
    private readonly playArea: HTMLElement,
  ) {
    this.el.addEventListener('click', () => this.handleClick());
  }

  setLabel(label: string): void {
    this.labelEl.textContent = label;
  }

  show(): void {
    this.el.classList.add('live');
  }

  hide(): void {
    this.el.classList.remove('live');
    this.clearRunner();
  }

  randomise(): void {
    const width = this.playArea.clientWidth;
    const height = this.playArea.clientHeight;
    const size = this.el.offsetWidth || 120;
    const maxX = Math.max(10, width - size - 20);
    const maxY = Math.max(10, height - size - 20);
    const x = Math.floor(Math.random() * maxX) + 10;
    const y = Math.floor(Math.random() * maxY) + 10;
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
  }

  enableRunner(dodges: number): void {
    this.clearRunner();
    this.runnerDodges = dodges;
    this.onEnter = () => {
      if (this.runnerDodges > 0) {
        this.randomise();
        this.runnerDodges--;
      }
    };
    this.el.addEventListener('mouseenter', this.onEnter);
  }

  nextClick(signal: AbortSignal): Promise<'clicked'> {
    return new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      this.clickResolver = resolve;
      const onAbort = () => {
        if (this.clickResolver === resolve) this.clickResolver = null;
        reject(new DOMException('Aborted', 'AbortError'));
      };
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  private handleClick(): void {
    if (!this.el.classList.contains('live')) return;
    const resolver = this.clickResolver;
    this.clickResolver = null;
    resolver?.('clicked');
  }

  private clearRunner(): void {
    this.runnerDodges = 0;
    if (this.onEnter) {
      this.el.removeEventListener('mouseenter', this.onEnter);
      this.onEnter = null;
    }
  }
}
