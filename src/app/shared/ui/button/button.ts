import { Component, input } from '@angular/core';

/** App button — consistent sizing + hover/active/focus/disabled states. */
@Component({
  selector: 'app-button',
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      class="inline-flex select-none items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45"
      [class.w-full]="full()"
      [class]="variantClass()"
    >
      <ng-content />
    </button>
  `,
  host: { '[class.block]': 'full()', '[class.w-full]': 'full()' },
})
export class Button {
  readonly type = input<'button' | 'submit'>('button');
  readonly variant = input<'primary' | 'ghost' | 'success' | 'danger'>('primary');
  readonly disabled = input(false);
  readonly full = input(false);

  variantClass() {
    switch (this.variant()) {
      case 'ghost':
        return 'border border-line bg-surface text-ink hover:bg-canvas hover:border-stone-300';
      case 'success':
        return 'bg-success text-white shadow-sm hover:brightness-110';
      case 'danger':
        return 'bg-danger text-white shadow-sm hover:brightness-110';
      default:
        return 'bg-brand text-white shadow-sm hover:bg-brand-dark';
    }
  }
}
