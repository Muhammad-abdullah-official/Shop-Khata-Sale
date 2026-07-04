import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { Icon } from '../../shared/ui/icon/icon';
import { Modal } from '../../shared/ui/modal/modal';
import { OrderService } from '../../core/services/order.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { OrderStatus } from '../../core/models';

const PAYMENT_LABELS: Record<string, string> = {
  manual_transfer: 'Bank/JazzCash + Screenshot',
  cod: 'Cash on Delivery',
  udhaar: 'Udhaar',
  card_gateway: 'Card / Wallet',
};

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, PageHeader, StatusBadge, Icon, Modal],
  templateUrl: './orders.html',
})
export class Orders {
  private readonly orderSvc = inject(OrderService);
  private readonly toast = inject(ToastService);
  private readonly confirmSvc = inject(ConfirmService);
  readonly paymentLabels = PAYMENT_LABELS;

  readonly filter = signal<'all' | OrderStatus>('all');
  readonly filters: Array<'all' | OrderStatus> = ['all', 'pending', 'confirmed', 'delivered', 'cancelled'];

  readonly orders = computed(() => {
    const f = this.filter();
    const all = this.orderSvc.orders();
    return f === 'all' ? all : all.filter((o) => o.orderStatus === f);
  });

  setFilter(f: 'all' | OrderStatus) {
    this.filter.set(f);
  }

  /** currently previewed payment screenshot (data URL) */
  readonly viewingProof = signal<string | null>(null);

  /** order detail modal — store id so the view stays live after actions */
  readonly viewingId = signal<string | null>(null);
  readonly viewingOrder = computed(() =>
    this.orderSvc.orders().find((o) => o.id === this.viewingId()) ?? null,
  );

  confirm(id: string) {
    this.confirmSvc.ask({
      title: 'Confirm order?',
      message: `${id} confirm karein? Order ka stock inventory se minus ho jayega.`,
      confirmLabel: 'Confirm Order',
      onConfirm: () => {
        this.orderSvc.confirm(id);
        this.toast.success(`${id} confirmed — stock updated`);
      },
    });
  }

  deliver(id: string) {
    this.confirmSvc.ask({
      title: 'Mark delivered?',
      message: `${id} deliver ho gaya? COD hai to payment "paid" ho jayegi.`,
      confirmLabel: 'Mark Delivered',
      onConfirm: () => {
        this.orderSvc.deliver(id);
        this.toast.success(`${id} delivered`);
      },
    });
  }

  approveCancel(id: string) {
    this.confirmSvc.ask({
      title: 'Approve cancellation?',
      message: `${id} cancel ho jayega — stock wapas, payment refund/reverse hoga. Ye wapas nahi hoga.`,
      confirmLabel: 'Approve Cancel',
      danger: true,
      onConfirm: () => {
        this.orderSvc.approveCancel(id);
        this.toast.success(`${id} cancelled — refund/reversal ho gaya`);
      },
    });
  }

  rejectCancel(id: string) {
    this.orderSvc.rejectCancel(id);
    this.toast.info(`${id} ka cancel request reject kar diya`);
  }
}
