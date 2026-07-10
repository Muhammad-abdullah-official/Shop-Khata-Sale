import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { CartItem, Order, PaymentMethod } from '../models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';
import { LedgerService } from './ledger.service';
import { ActivityService } from './activity.service';
import { NotificationService } from './notification.service';

const TABLE = 'orders';
const PROOF_BUCKET = 'payment-proofs';

function toOrder(r: Record<string, any>): Order {
  return {
    id: r['id'],
    customerId: r['customer_id'],
    customerName: r['customer_name'],
    type: r['type'],
    date: r['date'],
    total: Number(r['total']),
    paymentMethod: r['payment_method'],
    paymentStatus: r['payment_status'],
    orderStatus: r['order_status'],
    deliveryAddress: r['delivery_address'],
    paymentProofUrl: r['payment_proof_url'] ?? undefined,
    cancelRequested: r['cancel_requested'],
    items: (r['order_items'] ?? []).map((i: Record<string, any>) => ({
      productId: i['product_id'],
      productName: i['product_name'],
      qty: Number(i['qty']),
      salePrice: Number(i['sale_price']),
      subtotal: Number(i['subtotal']),
    })),
  };
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly productSvc = inject(ProductService);
  private readonly customerSvc = inject(CustomerService);
  private readonly ledgerSvc = inject(LedgerService);
  private readonly activity = inject(ActivityService);
  private readonly notify = inject(NotificationService);

  private readonly _orders = signal<Order[]>([]);
  readonly orders = this._orders.asReadonly();

  constructor() {
    effect(() => {
      this.auth.currentUser();
      void this.load();
    });
  }

  // ---------- derived ----------
  readonly pendingOrders = computed(() =>
    this._orders().filter((o) => o.orderStatus === 'pending'),
  );
  readonly totalOrdersCount = computed(() => this._orders().length);
  readonly deliveredCount = computed(
    () => this._orders().filter((o) => o.orderStatus === 'delivered').length,
  );
  readonly onlineOrdersCount = computed(
    () => this._orders().filter((o) => o.type === 'online').length,
  );
  readonly todaySales = computed(() => {
    const today = new Date().toISOString().slice(0, 10);
    return this._orders()
      .filter((o) => o.date === today && o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.total, 0);
  });
  readonly monthSales = computed(() => {
    const m = new Date().toISOString().slice(0, 7);
    return this._orders()
      .filter((o) => o.paymentStatus === 'paid' && o.date.startsWith(m))
      .reduce((sum, o) => sum + o.total, 0);
  });
  readonly totalSales = computed(() =>
    this._orders().filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
  );
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

  ordersForCustomer(customerId: string): Order[] {
    return this._orders().filter((o) => o.customerId === customerId);
  }

  // ---------- load ----------
  async load(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this._orders.set([]);
      return;
    }
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*, order_items(*)')
      .order('created_at', { ascending: false });
    if (error || !data) return;

    const orders = data.map(toOrder);
    await this.attachSignedProofUrls(orders);
    this._orders.set(orders);
  }

  /**
   * Payment screenshots live in a PRIVATE bucket. Only staff/owner can read
   * them, so we mint short-lived signed URLs instead of making them public.
   */
  private async attachSignedProofUrls(orders: Order[]): Promise<void> {
    if (!this.auth.isStaffOrOwner()) return;
    const paths = orders.map((o) => o.paymentProofUrl).filter((p): p is string => !!p);
    if (!paths.length) return;

    const { data } = await this.supabase.client.storage
      .from(PROOF_BUCKET)
      .createSignedUrls(paths, 3600);
    if (!data) return;

    const map = new Map(data.map((d) => [d.path, d.signedUrl]));
    orders.forEach((o) => {
      if (o.paymentProofUrl) o.paymentProofUrl = map.get(o.paymentProofUrl) ?? undefined;
    });
  }

  /** Upload a payment screenshot; returns the storage path (not a URL). */
  uploadProof(file: File): Promise<string | null> {
    return this.supabase.upload(PROOF_BUCKET, file);
  }

  // ---------- place ----------
  async placeOrder(params: {
    customerId: string | null;
    customerName: string;
    items: CartItem[];
    paymentMethod: PaymentMethod;
    deliveryAddress: string;
    paymentProofUrl?: string; // storage path
  }): Promise<string | null> {
    const total = params.items.reduce((s, i) => s + i.qty * i.salePrice, 0);
    const paymentStatus =
      params.paymentMethod === 'card_gateway'
        ? 'paid'
        : params.paymentMethod === 'udhaar'
          ? 'udhaar'
          : 'pending';

    const { data: order, error } = await this.supabase.client
      .from(TABLE)
      .insert({
        customer_id: params.customerId,
        customer_name: params.customerName,
        type: 'online',
        total,
        payment_method: params.paymentMethod,
        payment_status: paymentStatus,
        order_status: 'pending',
        delivery_address: params.deliveryAddress,
        payment_proof_url: params.paymentProofUrl ?? null,
      })
      .select('id')
      .single();
    if (error || !order) return null;

    const orderId: string = order['id'];
    await this.supabase.client.from('order_items').insert(
      params.items.map((i) => ({
        order_id: orderId,
        product_id: i.productId,
        product_name: i.name,
        qty: i.qty,
        sale_price: i.salePrice,
        subtotal: i.qty * i.salePrice,
      })),
    );

    // udhaar orders immediately hit the customer's ledger + balance
    if (params.paymentMethod === 'udhaar' && params.customerId) {
      const current = this.customerSvc.byId(params.customerId)?.udhaarBalance ?? 0;
      await this.customerSvc.addUdhaar(params.customerId, total);
      await this.ledgerSvc.addDebit(
        params.customerId, params.customerName, total, current + total, `Order ${orderId} (udhaar)`,
      );
    }

    await this.load();
    await this.activity.log('Placed order', orderId, 'cart');
    await this.notify.push({
      title: 'New order',
      message: `${params.customerName} — ${orderId} · PKR ${total.toLocaleString()}`,
      icon: 'receipt',
      link: '/admin/orders',
    });
    return orderId;
  }

  // ---------- admin actions ----------
  /** Confirm an order → deduct stock (atomically, per item). */
  async confirm(orderId: string): Promise<void> {
    const order = this._orders().find((o) => o.id === orderId);
    if (!order) return;
    for (const item of order.items) {
      if (item.productId) await this.productSvc.stockIn(item.productId, -item.qty);
    }
    await this.supabase.client.from(TABLE).update({ order_status: 'confirmed' }).eq('id', orderId);
    await this.load();
    await this.activity.log('Confirmed order', orderId, 'check-circle');
  }

  /** Mark delivered (COD becomes paid). */
  async deliver(orderId: string): Promise<void> {
    const order = this._orders().find((o) => o.id === orderId);
    if (!order) return;
    await this.supabase.client
      .from(TABLE)
      .update({
        order_status: 'delivered',
        payment_status: order.paymentMethod === 'cod' ? 'paid' : order.paymentStatus,
      })
      .eq('id', orderId);
    await this.load();
    await this.activity.log('Delivered order', orderId, 'truck');
  }

  /**
   * Customer cancels. Pending → cancel immediately (nothing moved yet).
   * Otherwise a refund is involved, so it needs the owner's approval.
   * Resolves true if cancelled outright, false if it needs approval.
   */
  async customerCancel(orderId: string): Promise<boolean> {
    const order = this._orders().find((o) => o.id === orderId);
    if (!order) return false;

    if (order.orderStatus === 'pending') {
      await this.reverseAndCancel(orderId);
      await this.activity.log('Cancelled order', orderId, 'x');
      return true;
    }

    await this.supabase.client.from(TABLE).update({ cancel_requested: true }).eq('id', orderId);
    await this.load();
    await this.activity.log('Requested cancel', orderId, 'clock');
    await this.notify.push({
      title: 'Cancel request',
      message: `${order.customerName} ne ${orderId} cancel karne ki request bheji`,
      icon: 'x',
      link: '/admin/orders',
    });
    return false;
  }

  /** Owner approves the cancel → reverse stock/payment/udhaar. */
  async approveCancel(orderId: string): Promise<void> {
    await this.reverseAndCancel(orderId);
    await this.activity.log('Approved cancel', orderId, 'x');
  }

  /** Owner rejects the cancel request → order stays. */
  async rejectCancel(orderId: string): Promise<void> {
    await this.supabase.client.from(TABLE).update({ cancel_requested: false }).eq('id', orderId);
    await this.load();
  }

  private async reverseAndCancel(orderId: string): Promise<void> {
    const order = this._orders().find((o) => o.id === orderId);
    if (!order) return;

    // restore stock if it had been deducted
    if (order.orderStatus === 'confirmed' || order.orderStatus === 'delivered') {
      for (const item of order.items) {
        if (item.productId) await this.productSvc.stockIn(item.productId, item.qty);
      }
    }

    // reverse udhaar: reduce balance + credit note
    if (order.paymentMethod === 'udhaar' && order.customerId) {
      const current = this.customerSvc.byId(order.customerId)?.udhaarBalance ?? 0;
      await this.customerSvc.reduceUdhaar(order.customerId, order.total);
      await this.ledgerSvc.addCredit(
        order.customerId, order.customerName, order.total, Math.max(0, current - order.total),
      );
    }

    await this.supabase.client
      .from(TABLE)
      .update({
        order_status: 'cancelled',
        payment_status: order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus,
        cancel_requested: false,
      })
      .eq('id', orderId);
    await this.load();
  }
}
