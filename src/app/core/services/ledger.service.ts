import { Injectable, effect, inject, signal } from '@angular/core';
import { LedgerEntry } from '../models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ActivityService } from './activity.service';

const TABLE = 'ledger';

function toEntry(r: Record<string, any>): LedgerEntry {
  return {
    id: r['id'],
    customerId: r['customer_id'],
    customerName: r['customer_name'],
    type: r['type'],
    amount: Number(r['amount']),
    balanceAfter: Number(r['balance_after']),
    date: r['date'],
    note: r['note'],
  };
}

@Injectable({ providedIn: 'root' })
export class LedgerService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly activity = inject(ActivityService);

  private readonly _entries = signal<LedgerEntry[]>([]);
  readonly entries = this._entries.asReadonly();

  constructor() {
    effect(() => {
      this.auth.currentUser();
      void this.load();
    });
  }

  entriesForCustomer(customerId: string): LedgerEntry[] {
    return this._entries().filter((e) => e.customerId === customerId);
  }

  async load(): Promise<void> {
    if (!this.auth.isLoggedIn()) {
      this._entries.set([]);
      return;
    }
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(300);
    if (error || !data) return;
    this._entries.set(data.map(toEntry));
  }

  /** Record udhaar given to a customer (debit entry). */
  async addDebit(
    customerId: string,
    customerName: string,
    amount: number,
    balanceAfter: number,
    note: string,
  ): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).insert({
      customer_id: customerId,
      customer_name: customerName,
      type: 'debit',
      amount,
      balance_after: balanceAfter,
      note,
    });
    if (error) return;
    await this.load();
    await this.activity.log('Added udhaar', `PKR ${amount.toLocaleString()} — ${customerName}`, 'notebook');
  }

  /** Record a payment received from a customer (credit entry). */
  async addCredit(
    customerId: string,
    customerName: string,
    amount: number,
    balanceAfter: number,
  ): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).insert({
      customer_id: customerId,
      customer_name: customerName,
      type: 'credit',
      amount,
      balance_after: balanceAfter,
      note: 'Payment received',
    });
    if (error) return;
    await this.load();
    await this.activity.log('Received payment', `PKR ${amount.toLocaleString()} from ${customerName}`, 'wallet');
  }
}
