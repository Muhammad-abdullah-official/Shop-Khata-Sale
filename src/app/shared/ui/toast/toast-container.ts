import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';
import { Icon, IconName } from '../icon/icon';

/** Renders active toasts bottom-right. Mounted once at app root. */
@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  template: `
    <div class="pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col gap-2 sm:inset-x-auto sm:bottom-5 sm:right-5 sm:w-80">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="animate-toast pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-[var(--shadow-pop)]"
        >
          <span class="grid h-7 w-7 shrink-0 place-items-center rounded-lg" [class]="badge(t.type)">
            <app-icon [name]="icon(t.type)" [size]="15" />
          </span>
          <p class="flex-1 pt-1 text-sm font-medium text-ink">{{ t.message }}</p>
          <button
            (click)="toast.dismiss(t.id)"
            class="text-faint transition hover:text-ink"
            aria-label="Dismiss"
          >
            <app-icon name="x" [size]="15" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainer {
  readonly toast = inject(ToastService);

  icon(t: string): IconName {
    return t === 'success' ? 'check-circle' : t === 'error' ? 'alert' : 'bell';
  }
  badge(t: string) {
    return t === 'success'
      ? 'bg-success-light text-success'
      : t === 'error'
        ? 'bg-danger-light text-danger'
        : 'bg-canvas text-ink';
  }
}
