import { Injectable, inject, signal } from '@angular/core';
import { LedgerEntry } from '../models';
import { ActivityService } from './activity.service';

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly activity = inject(ActivityService);

  private readonly _entries = signal<LedgerEntry[]>([
    { id: 'l1', customerId: 'c3', customerName: 'Bilal Hussain', type: 'debit', amount: 2500, balanceAfter: 7500, date: '2026-07-03', note: 'Order ORD-1041 (udhaar)' },
    { id: 'l2', customerId: 'c1', customerName: 'Ahmed Raza', type: 'debit', amount: 1200, balanceAfter: 3200, date: '2026-06-28', note: 'Grocery udhaar' },
    { id: 'l3', customerId: 'c1', customerName: 'Ahmed Raza', type: 'credit', amount: 2000, balanceAfter: 2000, date: '2026-06-20', note: 'Payment received' },
    { id: 'l4', customerId: 'c4', customerName: 'Fatima Noor', type: 'debit', amount: 1200, balanceAfter: 1200, date: '2026-06-15', note: 'Order udhaar' },
    { id: 'l5', customerId: 'c3', customerName: 'Bilal Hussain', type: 'debit', amount: 5000, balanceAfter: 5000, date: '2026-06-10', note: 'Bulk order udhaar' },
  ]);

  readonly entries = this._entries.asReadonly();

  /** All ledger entries for one customer, newest first. */
  entriesForCustomer(customerId: string): LedgerEntry[] {
    return this._entries().filter((e) => e.customerId === customerId);
  }

  /** Record udhaar given to a customer (debit entry). */
  addDebit(customerId: string, customerName: string, amount: number, balanceAfter: number, note: string): void {
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      customerId,
      customerName,
      type: 'debit',
      amount,
      balanceAfter,
      date: new Date().toISOString().slice(0, 10),
      note,
    };
    this._entries.update((list) => [entry, ...list]);
    this.activity.log('Added udhaar', `PKR ${amount.toLocaleString()} — ${customerName}`, 'notebook');
  }

  /** Record a payment received from a customer (credit entry). */
  addCredit(customerId: string, customerName: string, amount: number, balanceAfter: number): void {
    const entry: LedgerEntry = {
      id: crypto.randomUUID(),
      customerId,
      customerName,
      type: 'credit',
      amount,
      balanceAfter,
      date: new Date().toISOString().slice(0, 10),
      note: 'Payment received',
    };
    this._entries.update((list) => [entry, ...list]);
    this.activity.log('Received payment', `PKR ${amount.toLocaleString()} from ${customerName}`, 'wallet');
  }
}
