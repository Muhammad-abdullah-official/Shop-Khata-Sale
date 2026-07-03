import { Component, input, output } from '@angular/core';
import { Icon } from '../../ui/icon/icon';

/** Consistent title block at the top of every admin page. */
@Component({
  selector: 'app-page-header',
  imports: [Icon],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold tracking-tight text-ink">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="mt-1 text-sm text-muted">{{ subtitle() }}</p>
        }
      </div>
      @if (actionLabel()) {
        <button
          type="button"
          (click)="action.emit()"
          class="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark"
        >
          <app-icon name="plus" [size]="16" />
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class PageHeader {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly actionLabel = input<string>('');
  readonly action = output<void>();
}
