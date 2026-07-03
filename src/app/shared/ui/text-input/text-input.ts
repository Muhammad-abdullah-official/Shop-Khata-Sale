import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/** Label + input wired to a reactive FormControl. Shows a required-error hint. */
@Component({
  selector: 'app-text-input',
  imports: [ReactiveFormsModule],
  template: `
    <label class="block">
      <span class="mb-1 block text-sm font-medium text-ink">
        {{ label() }}
        @if (required()) {
          <span class="text-red-500">*</span>
        }
      </span>
      <input
        [type]="type()"
        [formControl]="control()"
        [placeholder]="placeholder()"
        class="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
        [class.border-red-400]="invalid()"
      />
      @if (invalid()) {
        <span class="mt-1 block text-xs text-red-600">{{ label() }} theek se bharein</span>
      }
    </label>
  `,
})
export class TextInput {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl>();
  readonly type = input<'text' | 'number' | 'tel' | 'email' | 'password'>('text');
  readonly placeholder = input('');
  readonly required = input(false);

  invalid() {
    const c = this.control();
    return c.touched && c.invalid;
  }
}
