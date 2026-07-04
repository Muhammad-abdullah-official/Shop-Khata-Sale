import { Component, computed, input } from '@angular/core';

/**
 * Soft, low-saturation status pill. One calm family per meaning:
 * green = done, amber = waiting, orange = udhaar, red = cancelled,
 * blue = in-progress, gray = neutral. Subtle bg + ring, not loud.
 */
@Component({
  selector: 'app-status-badge',
  template: `
    <span
      class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset"
      [class]="classes()"
    >
      {{ label() || status() }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<string>();
  readonly label = input<string>('');

  private readonly map: Record<string, string> = {
    // done / positive
    paid: 'bg-green-50 text-green-700 ring-green-600/15',
    delivered: 'bg-green-50 text-green-700 ring-green-600/15',
    ok: 'bg-green-50 text-green-700 ring-green-600/15',
    // in-progress
    confirmed: 'bg-blue-50 text-blue-700 ring-blue-600/15',
    // waiting
    pending: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    partial: 'bg-amber-50 text-amber-700 ring-amber-600/15',
    // udhaar (credit owed)
    udhaar: 'bg-orange-50 text-orange-700 ring-orange-600/15',
    low: 'bg-red-50 text-red-700 ring-red-600/15',
    // cancelled / negative
    cancelled: 'bg-red-50 text-red-700 ring-red-600/15',
    // neutral
    refunded: 'bg-stone-100 text-stone-600 ring-stone-500/15',
  };

  readonly classes = computed(
    () => this.map[this.status()] ?? 'bg-stone-100 text-stone-600 ring-stone-500/15',
  );
}
