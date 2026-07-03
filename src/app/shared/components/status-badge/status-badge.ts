import { Component, computed, input } from '@angular/core';

/** Colored pill for order/payment/stock statuses. Map-driven, no logic in templates. */
@Component({
  selector: 'app-status-badge',
  template: `
    <span
      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize"
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
    // order/payment states
    paid: 'bg-green-100 text-green-700',
    delivered: 'bg-green-100 text-green-700',
    confirmed: 'bg-blue-100 text-blue-700',
    pending: 'bg-amber-100 text-amber-700',
    partial: 'bg-amber-100 text-amber-700',
    udhaar: 'bg-orange-100 text-orange-700',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-purple-100 text-purple-700',
    // stock
    low: 'bg-red-100 text-red-700',
    ok: 'bg-green-100 text-green-700',
  };

  readonly classes = computed(() => this.map[this.status()] ?? 'bg-slate-100 text-slate-600');
}
