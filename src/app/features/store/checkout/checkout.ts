import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TextInput } from '../../../shared/ui/text-input/text-input';
import { Icon, IconName } from '../../../shared/ui/icon/icon';
import { CartService } from '../../../core/services/cart.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PaymentMethod } from '../../../core/models';

interface PayOption {
  value: PaymentMethod;
  label: string;
  desc: string;
  icon: IconName;
  disabled?: boolean;
}

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, ReactiveFormsModule, RouterLink, TextInput, Icon],
  templateUrl: './checkout.html',
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  readonly cart = inject(CartService);
  private readonly orderSvc = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly method = signal<PaymentMethod>('cod');

  readonly options: PayOption[] = [
    { value: 'cod', label: 'Cash on Delivery', desc: 'Delivery pe cash dein', icon: 'banknote' },
    { value: 'manual_transfer', label: 'Bank / JazzCash + Screenshot', desc: 'Transfer karke proof upload karein', icon: 'wallet' },
    { value: 'udhaar', label: 'Udhaar (baad me pay)', desc: 'Khaate me add hoga', icon: 'notebook' },
    { value: 'card_gateway', label: 'Card / Wallet', desc: 'Jald aa raha hai', icon: 'credit-card', disabled: true },
  ];

  /** payment screenshot as a data URL (manual_transfer only) */
  readonly proof = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    address: [this.auth.currentUser()?.address ?? '', Validators.required],
    phone: [this.auth.currentUser()?.phone ?? '', Validators.required],
  });

  onProofSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toast.error('Sirf image (screenshot) upload karein');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('Image 5MB se choti honi chahiye');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => this.proof.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeProof() {
    this.proof.set(null);
  }

  placeOrder() {
    if (this.form.invalid || !this.cart.items().length) {
      this.form.markAllAsTouched();
      return;
    }
    // manual transfer needs a payment screenshot
    if (this.method() === 'manual_transfer' && !this.proof()) {
      this.toast.error('Pehle payment ka screenshot upload karein');
      return;
    }
    const user = this.auth.currentUser();
    const id = this.orderSvc.placeOrder({
      customerId: user?.id ?? null,
      customerName: user?.name ?? 'Guest',
      items: this.cart.items(),
      paymentMethod: this.method(),
      deliveryAddress: this.form.getRawValue().address,
      paymentProofUrl: this.method() === 'manual_transfer' ? this.proof()! : undefined,
    });
    this.cart.clear();
    this.toast.success('Order place ho gaya!');
    this.router.navigate(['/store/order-success', id]);
  }
}
