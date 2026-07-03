import { Component, inject } from '@angular/core';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Button } from '../button/button';

/** Global confirm dialog. Mounted once at app root, driven by ConfirmService. */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Button],
  template: `
    @if (confirm.state(); as s) {
      <div class="animate-fade fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-ink/40" (click)="confirm.cancel()"></div>
        <div class="relative w-full max-w-sm rounded-xl bg-surface p-5 shadow-[var(--shadow-pop)]">
          <h3 class="text-base font-semibold text-ink">{{ s.title }}</h3>
          <p class="mt-1.5 text-sm text-muted">{{ s.message }}</p>
          <div class="mt-5 flex justify-end gap-2">
            <app-button variant="ghost" (click)="confirm.cancel()">Cancel</app-button>
            <app-button [variant]="s.danger ? 'danger' : 'primary'" (click)="confirm.confirm()">
              {{ s.confirmLabel }}
            </app-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialog {
  readonly confirm = inject(ConfirmService);
}
