import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
}

/** Label + dropdown wired to a reactive FormControl. */
@Component({
  selector: 'app-select-input',
  imports: [ReactiveFormsModule],
  template: `
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-ink">
        {{ label() }}
        @if (required()) {
          <span class="text-red-500">*</span>
        }
      </span>
      <select
        [formControl]="control()"
        class="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none transition-all duration-150 hover:border-stone-300 focus:border-ink focus:ring-4 focus:ring-ink/[0.06]"
        [class.border-danger]="invalid()"
      >
        @if (placeholder()) {
          <option value="" disabled>{{ placeholder() }}</option>
        }
        @for (opt of options(); track opt.value) {
          <option [value]="opt.value">{{ opt.label }}</option>
        }
      </select>
      @if (invalid()) {
        <span class="mt-1 block text-xs text-red-600">{{ label() }} chunein</span>
      }
    </label>
  `,
})
export class SelectInput {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl>();
  readonly options = input.required<SelectOption[]>();
  readonly placeholder = input('');
  readonly required = input(false);

  invalid() {
    const c = this.control();
    return c.touched && c.invalid;
  }
}
