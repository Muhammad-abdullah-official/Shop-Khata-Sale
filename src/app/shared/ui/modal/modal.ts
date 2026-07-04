import { Component, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Reusable dialog. Parent controls visibility (renders it or not).
 * Default slot = body, [footer] slot = action buttons.
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  template: `
    <div class="animate-fade fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" (click)="close.emit()"></div>

      <div class="animate-modal relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-surface shadow-[var(--shadow-pop)]">
        <div class="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 class="text-base font-semibold text-ink">{{ title() }}</h3>
          <button
            type="button"
            (click)="close.emit()"
            class="grid h-8 w-8 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink"
            aria-label="Close"
          >
            <app-icon name="x" [size]="18" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4">
          <ng-content />
        </div>

        <div class="flex justify-end gap-2 border-t border-line px-5 py-4">
          <ng-content select="[footer]" />
        </div>
      </div>
    </div>
  `,
})
export class Modal {
  readonly title = input.required<string>();
  readonly close = output<void>();
}
