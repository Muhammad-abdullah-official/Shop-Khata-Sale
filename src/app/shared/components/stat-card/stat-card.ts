import { Component, input } from '@angular/core';
import { Icon, IconName } from '../../ui/icon/icon';

/** KPI tile. Equal height in a grid (h-full); long text truncates with a tooltip. */
@Component({
  selector: 'app-stat-card',
  imports: [Icon],
  host: { class: 'block h-full' },
  template: `
    <div class="card flex h-full flex-col p-5">
      <div class="flex items-center justify-between gap-2">
        <span class="truncate text-sm font-medium text-muted" [title]="label()">{{ label() }}</span>
        <span class="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-canvas text-ink">
          <app-icon [name]="icon()" [size]="17" />
        </span>
      </div>
      <div
        class="mt-3 truncate text-[1.7rem] font-bold leading-none tracking-tight text-ink"
        [title]="value() ?? ''"
      >
        {{ value() }}
      </div>
      @if (hint()) {
        <div class="mt-2 truncate text-xs text-muted" [title]="hint()">{{ hint() }}</div>
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
