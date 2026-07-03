import { Injectable, computed, inject, signal } from '@angular/core';
import { CartItem, Order, PaymentMethod } from '../models';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';
import { LedgerService } from './ledger.service';
import { ActivityService } from './activity.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly productSvc = inject(ProductService);
  private readonly customerSvc = inject(CustomerService);
  private readonly ledgerSvc = inject(LedgerService);
  private readonly activity = inject(ActivityService);
  private orderSeq = 1043;
  private readonly _orders = signal<Order[]>([
    {
      id: 'ORD-1042', customerId: 'c1', customerName: 'Ahmed Raza', type: 'online', date: '2026-07-03',
      items: [
        { productId: 'p1', productName: 'Sugar 1kg', qty: 5, salePrice: 145, subtotal: 725 },
        { productId: 'p3', productName: 'Basmati Rice 5kg', qty: 1, salePrice: 1290, subtotal: 1290 },
      ],
      total: 2015, paymentMethod: 'manual_transfer', paymentStatus: 'pending', orderStatus: 'pending',
      deliveryAddress: 'Gulshan Block 5, Karachi',
    },
    {
      id: 'ORD-1041', customerId: 'c3', customerName: 'Bilal Hussain', type: 'online', date: '2026-07-03',
      items: [{ productId: 'p4', productName: 'Tea Pack 950g', qty: 2, salePrice: 1250, subtotal: 2500 }],
      total: 2500, paymentMethod: 'udhaar', paymentStatus: 'udhaar', orderStatus: 'confirmed',
      deliveryAddress: 'Nazimabad No.4, Karachi',
    },
    {
      id: 'ORD-1040', customerId: 'c2', customerName: 'Sana Malik', type: 'online', date: '2026-07-02',
      items: [{ productId: 'p7', productName: 'Milk Pack 1L', qty: 6, salePrice: 210, subtotal: 1260 }],
      total: 1260, paymentMethod: 'cod', paymentStatus: 'paid', orderStatus: 'delivered',
      deliveryAddress: 'DHA Phase 6, Karachi',
    },
    {
      id: 'ORD-1039', customerId: 'c4', customerName: 'Fatima Noor', type: 'online', date: '2026-07-02',
      items: [{ productId: 'p5', productName: 'Wheat Flour 10kg', qty: 1, salePrice: 1420, subtotal: 1420 }],
      total: 1420, paymentMethod: 'card_gateway', paymentStatus: 'paid', orderStatus: 'delivered',
      deliveryAddress: 'Clifton Block 2, Karachi',
    },
    {
      id: 'ORD-1038', customerId: null, customerName: 'Walk-in', type: 'counter', date: '2026-07-01',
      items: [{ productId: 'p8', productName: 'Salt 800g', qty: 4, salePrice: 55, subtotal: 220 }],
      total: 220, paymentMethod: 'cod', paymentStatus: 'paid', orderStatus: 'delivered',
      deliveryAddress: '—',
    },
  ]);

  readonly orders = this._orders.asReadonly();
  readonly pendingOrders = computed(() =>
    this._orders().filter((o) => o.orderStatus === 'pending'),
  );
  readonly todaySales = computed(() =>
    this._orders()
      .filter((o) => o.date === '2026-07-03' && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
  );
  readonly totalSales = computed(() =>
    this._orders()
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0),
  );

  ordersForCustomer(customerId: string) {
    return this._orders().filter((o) => o.customerId === customerId);
  }

  private thisMonth() {
    return new Date().toISOString().slice(0, 7); // YYYY-MM
  }

  readonly totalOrdersCount = computed(() => this._orders().length);
  readonly deliveredCount = computed(
    () => this._orders().filter((o) => o.orderStatus === 'delivered').length,
  );
  readonly onlineOrdersCount = computed(
    () => this._orders().filter((o) => o.type === 'online').length,
  );

  readonly monthSales = computed(() => {
    const m = this.thisMonth();
    return this._orders()
      .filter((o) => o.paymentStatus === 'paid' && o.date.startsWith(m))
      .reduce((sum, o) => sum + o.total, 0);
  });

  readonly avgOrderValue = computed(() => {
    const paid = this._orders().filter((o) => o.paymentStatus === 'paid');
    return paid.length ? Math.round(paid.reduce((s, o) => s + o.total, 0) / paid.length) : 0;
  });

  /** Estimated profit on paid orders = Σ (sale − cost) × qty. */
  readonly estimatedProfit = computed(() => {
    const products = this.productSvc.products();
    return this._orders()
      .filter((o) => o.paymentStatus === 'paid')
      .reduce(
        (sum, o) =>
          sum +
          o.items.reduce((s, it) => {
            const cost = products.find((p) => p.id === it.productId)?.costPrice ?? 0;
            return s + (it.salePrice - cost) * it.qty;
          }, 0),
        0,
      );
  });

  /** Place an online order from the customer store. Returns the order id. */
  placeOrder(params: {
    customerId: string | null;
    customerName: string;
    items: CartItem[];
    paymentMethod: PaymentMethod;
    deliveryAddress: string;
    paymentProofUrl?: string;
  }): string {
    const items = params.items.map((i) => ({
      productId: i.productId,
      productName: i.name,
      qty: i.qty,
      salePrice: i.salePrice,
      subtotal: i.qty * i.salePrice,
    }));
    const total = items.reduce((s, i) => s + i.subtotal, 0);

    const paymentStatus =
      params.paymentMethod === 'card_gateway'
        ? 'paid'
        : params.paymentMethod === 'udhaar'
          ? 'udhaar'
          : 'pending';

    const order: Order = {
      id: `ORD-${this.orderSeq++}`,
      customerId: params.customerId,
      customerName: params.customerName,
      type: 'online',
      date: new Date().toISOString().slice(0, 10),
      items,
      total,
      paymentMethod: params.paymentMethod,
      paymentStatus,
      orderStatus: 'pending',
      deliveryAddress: params.deliveryAddress,
      paymentProofUrl: params.paymentProofUrl,
    };
    this._orders.update((list) => [order, ...list]);

    // udhaar orders immediately hit the customer's ledger + balance
    if (params.paymentMethod === 'udhaar' && params.customerId) {
      const customer = this.customerSvc.customers().find((c) => c.id === params.customerId);
      const balanceAfter = (customer?.udhaarBalance ?? 0) + total;
      this.customerSvc.addUdhaar(params.customerId, total);
      this.ledgerSvc.addDebit(params.customerId, params.customerName, total, balanceAfter, `Order ${order.id} (udhaar)`);
    }
    this.activity.log('Placed order', order.id, 'cart');
    return order.id;
  }

  /** Admin confirms an order → reduce stock. */
  confirm(orderId: string): void {
    const order = this._orders().find((o) => o.id === orderId);
    if (!order) return;
    order.items.forEach((i) => this.productSvc.stockIn(i.productId, -i.qty));
    this._orders.update((list) =>
      list.map((o) => (o.id === orderId ? { ...o, orderStatus: 'confirmed' } : o)),
    );
    this.activity.log('Confirmed order', orderId, 'check-circle');
  }

  /** Admin marks an order delivered (COD becomes paid). */
  deliver(orderId: string): void {
    this._orders.update((list) =>
      list.map((o) =>
        o.id === orderId
          ? {
              ...o,
              orderStatus: 'delivered',
              paymentStatus: o.paymentMethod === 'cod' ? 'paid' : o.paymentStatus,
            }
          : o,
      ),
    );
    this.activity.log('Delivered order', orderId, 'truck');
  }

  /**
   * Customer cancels their order.
   * - Still pending (owner ne confirm nahi kiya) → turant cancel, koi paisa/stock move nahi hua.
   * - Confirmed/paid/udhaar → refund owner ki permission se hoga, isliye sirf request set hoti hai.
   * Returns true if cancelled immediately, false if it needs owner approval.
   */
  customerCancel(orderId: string): boolean {
    const order = this._orders().find((o) => o.id === orderId);
    if (!order) return false;
    if (order.orderStatus === 'pending') {
      this.reverseAndCancel(order);
      this.activity.log('Cancelled order', orderId, 'x');
      return true;
    }
    this._orders.update((list) =>
      list.map((o) => (o.id === orderId ? { ...o, cancelRequested: true } : o)),
    );
    this.activity.log('Requested cancel', orderId, 'clock');
    return false;
  }

  /** Owner approves the cancel → reverse stock/payment/udhaar. */
  approveCancel(orderId: string): void {
    const order = this._orders().find((o) => o.id === orderId);
    if (order) {
      this.reverseAndCancel(order);
      this.activity.log('Approved cancel', orderId, 'x');
    }
  }

  /** Owner rejects the cancel request → order stays. */
  rejectCancel(orderId: string): void {
    this._orders.update((list) =>
      list.map((o) => (o.id === orderId ? { ...o, cancelRequested: false } : o)),
    );
  }

  private reverseAndCancel(order: Order): void {
    // restore stock if it had been deducted (confirmed/delivered)
    if (order.orderStatus === 'confirmed' || order.orderStatus === 'delivered') {
      order.items.forEach((i) => this.productSvc.stockIn(i.productId, i.qty));
    }
    // reverse udhaar: reduce balance + credit note
    if (order.paymentMethod === 'udhaar' && order.customerId) {
      const c = this.customerSvc.byId(order.customerId);
      const balanceAfter = Math.max(0, (c?.udhaarBalance ?? 0) - order.total);
      this.customerSvc.reduceUdhaar(order.customerId, order.total);
      this.ledgerSvc.addCredit(order.customerId, order.customerName, order.total, balanceAfter);
    }
    const newPayment: Order['paymentStatus'] =
      order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus;

    this._orders.update((list) =>
      list.map((o) =>
        o.id === order.id
          ? { ...o, orderStatus: 'cancelled', paymentStatus: newPayment, cancelRequested: false }
          : o,
      ),
    );
  }
}
