import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Customer } from '../models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

const TABLE = 'customers';

function toCustomer(r: Record<string, any>): Customer {
  return {
    id: r['id'],
    name: r['name'],
    phone: r['phone'],
    address: r['address'],
    joinedDate: r['joined_date'],
    udhaarBalance: Number(r['udhaar_balance']),
    totalOrders: Number(r['total_orders']),
  };
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _customers = signal<Customer[]>([]);
  readonly customers = this._customers.asReadonly();
  readonly totalCustomers = computed(() => this._customers().length);
  readonly totalUdhaar = computed(() =>
    this._customers().reduce((sum, c) => sum + c.udhaarBalance, 0),
  );

  constructor() {
    effect(() => {
      this.auth.currentUser();
      void this.load();
    });
  }

  async load(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this._customers.set([]);
      return;
    }
    // RLS: staff/owner see everyone, a customer sees only their own row
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    this._customers.set(data.map(toCustomer));
  }

  byId(id: string): Customer | undefined {
    return this._customers().find((c) => c.id === id);
  }

  /** Adds a walk-in customer. Returns the new id. */
  async add(
    data: Omit<Customer, 'id' | 'totalOrders' | 'udhaarBalance'>,
    id?: string,
  ): Promise<string | null> {
    const row: Record<string, unknown> = {
      name: data.name,
      phone: data.phone,
      address: data.address,
      joined_date: data.joinedDate,
    };
    if (id) row['id'] = id;

    const { data: res, error } = await this.supabase.client
      .from(TABLE)
      .insert(row)
      .select('id')
      .single();
    if (error || !res) return null;
    await this.load();
    return res['id'];
  }

  async update(id: string, data: Pick<Customer, 'name' | 'phone' | 'address'>): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).update(data).eq('id', id);
    if (!error) await this.load();
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).delete().eq('id', id);
    if (!error) await this.load();
  }

  /** Atomic udhaar change. Positive = udhaar diya, negative = payment received. */
  private async adjust(customerId: string, delta: number, ordersDelta = 0): Promise<void> {
    const { error } = await this.supabase.client.rpc('adjust_customer_udhaar', {
      c_id: customerId,
      p_delta: delta,
      p_orders_delta: ordersDelta,
    });
    if (!error) await this.load();
  }

  addUdhaar(customerId: string, amount: number): Promise<void> {
    return this.adjust(customerId, amount, 1);
  }

  reduceUdhaar(customerId: string, amount: number): Promise<void> {
    return this.adjust(customerId, -amount, 0);
  }
}
