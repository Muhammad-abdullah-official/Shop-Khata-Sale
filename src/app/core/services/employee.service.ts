import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Employee } from '../models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { ActivityService } from './activity.service';

const TABLE = 'employees';

function toEmployee(r: Record<string, any>): Employee {
  return {
    id: r['id'],
    name: r['name'],
    phone: r['phone'],
    monthlySalary: Number(r['monthly_salary']),
    paidThisMonth: Number(r['paid_this_month']),
    joinDate: r['join_date'],
    active: r['active'],
  };
}

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly activity = inject(ActivityService);

  private readonly _employees = signal<Employee[]>([]);
  readonly employees = this._employees.asReadonly();
  readonly salaryDue = computed(() =>
    this._employees()
      .filter((e) => e.active)
      .reduce((sum, e) => sum + (e.monthlySalary - e.paidThisMonth), 0),
  );

  constructor() {
    effect(() => {
      this.auth.currentUser();
      void this.load();
    });
  }

  async load(): Promise<void> {
    if (!this.auth.isOwner()) {
      this._employees.set([]);
      return;
    }
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) return;
    this._employees.set(data.map(toEmployee));
  }

  /** Adds an employee. Pass `id` (the auth uid) when they also get a login. */
  async add(
    data: Omit<Employee, 'id' | 'paidThisMonth' | 'active'>,
    id?: string,
  ): Promise<string | null> {
    const row: Record<string, unknown> = {
      name: data.name,
      phone: data.phone,
      monthly_salary: data.monthlySalary,
      join_date: data.joinDate,
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

  async update(id: string, data: Pick<Employee, 'name' | 'phone' | 'monthlySalary'>): Promise<void> {
    const { error } = await this.supabase.client
      .from(TABLE)
      .update({ name: data.name, phone: data.phone, monthly_salary: data.monthlySalary })
      .eq('id', id);
    if (!error) await this.load();
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).delete().eq('id', id);
    if (!error) await this.load();
  }

  /** Record a salary payment for this month (atomic). */
  async paySalary(employeeId: string, amount: number): Promise<void> {
    const name = this._employees().find((e) => e.id === employeeId)?.name ?? 'employee';
    const { error } = await this.supabase.client.rpc('pay_employee_salary', {
      e_id: employeeId,
      amount,
    });
    if (error) return;
    await this.load();
    await this.activity.log('Paid salary', `PKR ${amount.toLocaleString()} — ${name}`, 'banknote');
  }
}
