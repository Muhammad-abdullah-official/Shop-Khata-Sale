import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatusBadge } from '../../../shared/components/status-badge/status-badge';
import { StatCard } from '../../../shared/components/stat-card/stat-card';
import { Icon } from '../../../shared/ui/icon/icon';
import { Modal } from '../../../shared/ui/modal/modal';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { CustomerService } from '../../../core/services/customer.service';
import { LedgerService } from '../../../core/services/ledger.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { Order } from '../../../core/models';

@Component({
  selector: 'app-account',
  imports: [CurrencyPipe, RouterLink, StatusBadge, StatCard, Icon, Modal],
  templateUrl: './account.html',
})
export class Account {
  readonly auth = inject(AuthService);
  private readonly orderSvc = inject(OrderService);
  private readonly customerSvc = inject(CustomerService);
  private readonly ledgerSvc = inject(LedgerService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);

  private readonly uid = computed(() => this.auth.currentUser()?.id ?? '');

  readonly orders = computed(() => this.orderSvc.ordersForCustomer(this.uid()));

  readonly viewingId = signal<string | null>(null);
  readonly viewingOrder = computed(() => this.orders().find((o) => o.id === this.viewingId()) ?? null);

  // ---- shopping KPIs ----
  readonly totalSpent = computed(() => this.orders().reduce((s, o) => s + o.total, 0));

  readonly monthSpent = computed(() => {
    const m = new Date().toISOString().slice(0, 7);
    return this.orders()
      .filter((o) => o.date.startsWith(m))
      .reduce((s, o) => s + o.total, 0);
  });

  readonly orderCount = computed(() => this.orders().length);
  readonly deliveredCount = computed(
    () => this.orders().filter((o) => o.orderStatus === 'delivered').length,
  );

  // ---- udhaar breakdown ----
  readonly ledger = computed(() => this.ledgerSvc.entriesForCustomer(this.uid()));
  readonly udhaarBalance = computed(() => this.customerSvc.byId(this.uid())?.udhaarBalance ?? 0);
  readonly totalTaken = computed(() =>
    this.ledger().filter((e) => e.type === 'debit').reduce((s, e) => s + e.amount, 0),
  );
  readonly totalPaid = computed(() =>
    this.ledger().filter((e) => e.type === 'credit').reduce((s, e) => s + e.amount, 0),
  );

  canCancel(o: Order): boolean {
    return (o.orderStatus === 'pending' || o.orderStatus === 'confirmed') && !o.cancelRequested;
  }

  cancel(o: Order): void {
    this.confirm.ask({
      title: 'Cancel order?',
      message: `Order ${o.id} cancel karna hai?` + (o.orderStatus !== 'pending' ? ' Payment refund owner ki permission se hoga.' : ''),
      confirmLabel: 'Yes, cancel',
      danger: true,
      onConfirm: async () => {
        const done = await this.orderSvc.customerCancel(o.id);
        if (done) this.toast.success('Order cancel ho gaya');
        else this.toast.info('Cancel request bhej di — owner approve karega');
      },
    });
  }
}
