import { Injectable, computed, signal } from '@angular/core';
import { Customer } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private readonly _customers = signal<Customer[]>([
    { id: 'c1', name: 'Ahmed Raza', phone: '0300-1112223', address: 'Gulshan Block 5, Karachi', totalOrders: 14, udhaarBalance: 3200, joinedDate: '2025-11-02' },
    { id: 'c2', name: 'Sana Malik', phone: '0321-3334445', address: 'DHA Phase 6, Karachi', totalOrders: 8, udhaarBalance: 0, joinedDate: '2026-01-15' },
    { id: 'c3', name: 'Bilal Hussain', phone: '0333-6667778', address: 'Nazimabad No.4, Karachi', totalOrders: 22, udhaarBalance: 7500, joinedDate: '2025-09-20' },
    { id: 'c4', name: 'Fatima Noor', phone: '0345-9990001', address: 'Clifton Block 2, Karachi', totalOrders: 5, udhaarBalance: 1200, joinedDate: '2026-03-10' },
    { id: 'c5', name: 'Zeeshan Iqbal', phone: '0301-2223334', address: 'Malir Cantt, Karachi', totalOrders: 11, udhaarBalance: 0, joinedDate: '2026-02-05' },
  ]);

  readonly customers = this._customers.asReadonly();
  readonly totalCustomers = computed(() => this._customers().length);
  readonly totalUdhaar = computed(() =>
    this._customers().reduce((sum, c) => sum + c.udhaarBalance, 0),
  );

  /** Adds a customer. Pass an id to keep it in sync with the auth user; returns the id. */
  add(data: Omit<Customer, 'id' | 'totalOrders' | 'udhaarBalance'>, id = crypto.randomUUID()): string {
    const customer: Customer = { ...data, id, totalOrders: 0, udhaarBalance: 0 };
    this._customers.update((list) => [customer, ...list]);
    return id;
  }

  byId(id: string): Customer | undefined {
    return this._customers().find((c) => c.id === id);
  }

  update(id: string, data: Pick<Customer, 'name' | 'phone' | 'address'>): void {
    this._customers.update((list) =>
      list.map((c) => (c.id === id ? { ...c, ...data } : c)),
    );
  }

  remove(id: string): void {
    this._customers.update((list) => list.filter((c) => c.id !== id));
  }

  /** Increase a customer's udhaar balance (e.g. an udhaar order). */
  addUdhaar(customerId: string, amount: number): void {
    this._customers.update((list) =>
      list.map((c) =>
        c.id === customerId
          ? { ...c, udhaarBalance: c.udhaarBalance + amount, totalOrders: c.totalOrders + 1 }
          : c,
      ),
    );
  }

  /** Reduce a customer's udhaar balance when a payment is received. */
  reduceUdhaar(customerId: string, amount: number): void {
    this._customers.update((list) =>
      list.map((c) =>
        c.id === customerId
          ? { ...c, udhaarBalance: Math.max(0, c.udhaarBalance - amount) }
          : c,
      ),
    );
  }
}
