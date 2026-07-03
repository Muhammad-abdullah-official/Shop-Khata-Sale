import { Injectable, computed, inject, signal } from '@angular/core';
import { Vendor } from '../models';
import { ActivityService } from './activity.service';

@Injectable({ providedIn: 'root' })
export class VendorService {
  private readonly activity = inject(ActivityService);

  private readonly _vendors = signal<Vendor[]>([
    { id: 'v1', name: 'Al-Karam Traders', contactPerson: 'Bilal Ahmed', phone: '0300-1234567', address: 'Jodia Bazar, Karachi', totalPurchased: 285000, totalPaid: 220000, balance: 65000 },
    { id: 'v2', name: 'National Foods Dist.', contactPerson: 'Usman Ali', phone: '0321-9876543', address: 'SITE Area, Karachi', totalPurchased: 142000, totalPaid: 142000, balance: 0 },
    { id: 'v3', name: 'Fresh Dairy Supply', contactPerson: 'Kamran Sheikh', phone: '0333-5551212', address: 'Landhi, Karachi', totalPurchased: 98000, totalPaid: 74000, balance: 24000 },
    { id: 'v4', name: 'Metro Wholesale', contactPerson: 'Faisal Khan', phone: '0345-4443322', address: 'North Nazimabad', totalPurchased: 410000, totalPaid: 360000, balance: 50000 },
  ]);

  readonly vendors = this._vendors.asReadonly();
  readonly totalPayable = computed(() =>
    this._vendors().reduce((sum, v) => sum + v.balance, 0),
  );

  add(data: Omit<Vendor, 'id' | 'balance'>): void {
    const vendor: Vendor = {
      ...data,
      id: crypto.randomUUID(),
      balance: data.totalPurchased - data.totalPaid,
    };
    this._vendors.update((list) => [vendor, ...list]);
  }

  update(id: string, data: Pick<Vendor, 'name' | 'contactPerson' | 'phone' | 'address'>): void {
    this._vendors.update((list) =>
      list.map((v) => (v.id === id ? { ...v, ...data } : v)),
    );
  }

  remove(id: string): void {
    this._vendors.update((list) => list.filter((v) => v.id !== id));
  }

  /** Record a purchase against a vendor (raises purchased + balance). */
  addPurchase(vendorId: string, amount: number): void {
    const name = this._vendors().find((v) => v.id === vendorId)?.name ?? 'vendor';
    this._vendors.update((list) =>
      list.map((v) =>
        v.id === vendorId
          ? { ...v, totalPurchased: v.totalPurchased + amount, balance: v.balance + amount }
          : v,
      ),
    );
    this.activity.log('Stock purchase', `PKR ${amount.toLocaleString()} — ${name}`, 'truck');
  }
}
