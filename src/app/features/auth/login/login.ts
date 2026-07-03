import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TextInput } from '../../../shared/ui/text-input/text-input';
import { Button } from '../../../shared/ui/button/button';
import { Icon } from '../../../shared/ui/icon/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, TextInput, Button, Icon],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  fillDemo(kind: 'owner' | 'staff' | 'customer') {
    const creds = {
      owner: { email: 'owner@shop.pk', password: 'owner123' },
      staff: { email: 'staff@shop.pk', password: 'staff123' },
      customer: { email: 'ahmed@test.pk', password: '12345' },
    }[kind];
    this.form.setValue(creds);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, password } = this.form.getRawValue();
    const err = this.auth.login(email, password);
    if (err) {
      this.error.set(err);
      return;
    }
    this.error.set('');
    this.toast.success('Welcome back!');
    const dest = this.auth.isOwner()
      ? '/admin/dashboard'
      : this.auth.isStaff()
        ? '/admin/orders'
        : '/store';
    this.router.navigateByUrl(dest);
  }
}
