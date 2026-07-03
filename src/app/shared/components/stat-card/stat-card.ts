import { Component, input } from '@angular/core';
import { Icon, IconName } from '../../ui/icon/icon';

/** KPI tile. Minimal, neutral — color only via the value if needed. */
@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  template: `
    <div class="card p-5">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-muted">{{ label() }}</span>
        <span class="grid h-8 w-8 place-items-center rounded-lg bg-canvas text-ink">
          <app-icon [name]="icon()" [size]="17" />
        </span>
      </div>
      <div class="mt-3 text-[1.7rem] font-bold leading-none tracking-tight text-ink">{{ value() }}</div>
      @if (hint()) {
        <div class="mt-2 text-xs text-muted">{{ hint() }}</div>
      }
    </div>
  `,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | null>();
  readonly icon = input<IconName>('box');
  readonly hint = input<string>('');
}
