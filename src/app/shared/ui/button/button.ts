import { Component, input } from '@angular/core';

/** App button with a few variants. Use type="submit" inside forms. */
@Component({
  selector: 'app-button',
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      class="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
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
        return 'border border-line bg-surface text-muted hover:text-ink hover:border-slate-300';
      case 'success':
        return 'bg-success text-white hover:brightness-95 shadow-sm';
      case 'danger':
        return 'bg-danger text-white hover:brightness-95 shadow-sm';
      default:
        return 'bg-brand text-white hover:bg-brand-dark shadow-sm';
    }
  }
}
