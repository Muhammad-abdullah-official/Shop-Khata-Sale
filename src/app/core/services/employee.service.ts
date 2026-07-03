import { Injectable, computed, inject, signal } from '@angular/core';
import { Employee } from '../models';
import { ActivityService } from './activity.service';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly activity = inject(ActivityService);

  private readonly _employees = signal<Employee[]>([
    { id: 'e1', name: 'Imran Shah', phone: '0300-7778889', monthlySalary: 45000, paidThisMonth: 30000, joinDate: '2025-06-01', active: true },
    { id: 'e2', name: 'Waqas Ahmed', phone: '0321-4445556', monthlySalary: 38000, paidThisMonth: 38000, joinDate: '2025-10-12', active: true },
    { id: 'e3', name: 'Hamza Tariq', phone: '0333-1231234', monthlySalary: 35000, paidThisMonth: 20000, joinDate: '2026-04-01', active: true },
  ]);

  readonly employees = this._employees.asReadonly();
  readonly salaryDue = computed(() =>
    this._employees()
      .filter((e) => e.active)
      .reduce((sum, e) => sum + (e.monthlySalary - e.paidThisMonth), 0),
  );

  add(data: Omit<Employee, 'id' | 'paidThisMonth' | 'active'>): string {
    const id = crypto.randomUUID();
    const employee: Employee = { ...data, id, paidThisMonth: 0, active: true };
    this._employees.update((list) => [employee, ...list]);
    return id;
  }

  update(id: string, data: Pick<Employee, 'name' | 'phone' | 'monthlySalary'>): void {
    this._employees.update((list) =>
      list.map((e) => (e.id === id ? { ...e, ...data } : e)),
    );
  }

  remove(id: string): void {
    this._employees.update((list) => list.filter((e) => e.id !== id));
  }

  /** Record a salary payment for this month. */
  paySalary(employeeId: string, amount: number): void {
    const name = this._employees().find((e) => e.id === employeeId)?.name ?? 'employee';
    this._employees.update((list) =>
      list.map((e) =>
        e.id === employeeId
          ? { ...e, paidThisMonth: Math.min(e.monthlySalary, e.paidThisMonth + amount) }
          : e,
      ),
    );
    this.activity.log('Paid salary', `PKR ${amount.toLocaleString()} — ${name}`, 'banknote');
  }
}
