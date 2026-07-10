import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Vendor } from '../models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ActivityService } from './activity.service';

const TABLE = 'vendors';

function toVendor(r: Record<string, any>): Vendor {
  return {
    id: r['id'],
    name: r['name'],
    contactPerson: r['contact_person'],
    phone: r['phone'],
    address: r['address'],
    totalPurchased: Number(r['total_purchased']),
    totalPaid: Number(r['total_paid']),
    balance: Number(r['balance']),
  };
}

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly activity = inject(ActivityService);

  private readonly _vendors = signal<Vendor[]>([]);
  readonly vendors = this._vendors.asReadonly();
  readonly totalPayable = computed(() =>
    this._vendors().reduce((sum, v) => sum + v.balance, 0),
  );

  constructor() {
    effect(() => {
      this.auth.currentUser();
      void this.load();
    });
  }

  async load(): Promise<void> {
    if (!this.auth.isOwner()) {
      this._vendors.set([]);
      return;
    }
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    this._vendors.set(data.map(toVendor));
  }

  async add(data: Omit<Vendor, 'id' | 'balance'>): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).insert({
      name: data.name,
      contact_person: data.contactPerson,
      phone: data.phone,
      address: data.address,
      total_purchased: data.totalPurchased,
      total_paid: data.totalPaid,
    });
    if (!error) await this.load();
  }

  async update(id: string, data: Pick<Vendor, 'name' | 'contactPerson' | 'phone' | 'address'>): Promise<void> {
    const { error } = await this.supabase.client
      .from(TABLE)
      .update({
        name: data.name,
        contact_person: data.contactPerson,
        phone: data.phone,
        address: data.address,
      })
      .eq('id', id);
    if (!error) await this.load();
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).delete().eq('id', id);
    if (!error) await this.load();
  }

  /** Record a purchase against a vendor (raises purchased + balance). */
  async addPurchase(vendorId: string, amount: number): Promise<void> {
    const name = this._vendors().find((v) => v.id === vendorId)?.name ?? 'vendor';
    const { error } = await this.supabase.client.rpc('adjust_vendor', {
      v_id: vendorId,
      purchased_delta: amount,
      paid_delta: 0,
    });
    if (error) return;
    await this.load();
    await this.activity.log('Stock purchase', `PKR ${amount.toLocaleString()} — ${name}`, 'truck');
  }

  /** Record a payment made to a vendor (reduces payable). */
  async payVendor(vendorId: string, amount: number): Promise<void> {
    const name = this._vendors().find((v) => v.id === vendorId)?.name ?? 'vendor';
    const { error } = await this.supabase.client.rpc('adjust_vendor', {
      v_id: vendorId,
      purchased_delta: 0,
      paid_delta: amount,
    });
    if (error) return;
    await this.load();
    await this.activity.log('Paid vendor', `PKR ${amount.toLocaleString()} — ${name}`, 'wallet');
  }
}
