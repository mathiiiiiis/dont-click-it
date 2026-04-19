export function shake(el: HTMLElement, durationMs = 400): void {
  el.classList.add('shaking');
  setTimeout(() => el.classList.remove('shaking'), durationMs);
}
