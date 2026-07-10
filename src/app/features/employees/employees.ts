import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { Modal } from '../../shared/ui/modal/modal';
import { TextInput } from '../../shared/ui/text-input/text-input';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Employee } from '../../core/models';

@Component({
  selector: 'app-employees',
  imports: [CurrencyPipe, ReactiveFormsModule, PageHeader, StatCard, Modal, TextInput, Button, Icon],
  templateUrl: './employees.html',
})
export class Employees {
  private readonly employeeSvc = inject(EmployeeService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);

  readonly employees = this.employeeSvc.employees;
  readonly salaryDue = this.employeeSvc.salaryDue;

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly payingFor = signal<Employee | null>(null);
  readonly modalTitle = computed(() => (this.editingId() ? 'Edit Employee' : 'Add Employee'));

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    monthlySalary: [0, [Validators.required, Validators.min(1)]],
    joinDate: [new Date().toISOString().slice(0, 10), Validators.required],
    email: [''], // optional login
    password: [''],
  });

  readonly payForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(1)]],
  });

  remaining(e: Employee): number {
    return e.monthlySalary - e.paidThisMonth;
  }

  openForm(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '', phone: '', monthlySalary: 0,
      joinDate: new Date().toISOString().slice(0, 10), email: '', password: '',
    });
    this.showForm.set(true);
  }

  openEdit(e: Employee): void {
    this.editingId.set(e.id);
    this.form.reset({
      name: e.name, phone: e.phone, monthlySalary: e.monthlySalary,
      joinDate: e.joinDate, email: '', password: '',
    });
    this.showForm.set(true);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const id = this.editingId();

    if (id) {
      await this.employeeSvc.update(id, { name: v.name, phone: v.phone, monthlySalary: v.monthlySalary });
      this.toast.success('Employee update ho gaya');
      this.showForm.set(false);
      return;
    }

    const base = { name: v.name, phone: v.phone, monthlySalary: v.monthlySalary, joinDate: v.joinDate };

    // optional: create a staff login first, then use its uid as the employee id
    if (v.email.trim() && v.password.trim()) {
      const res = await this.auth.addStaff({
        name: v.name, email: v.email, password: v.password, phone: v.phone,
      });
      if (res.error) {
        this.toast.error(res.error);
        return;
      }
      await this.employeeSvc.add(base, res.id);
      this.toast.success('Employee + login ban gaya');
    } else {
      await this.employeeSvc.add(base);
      this.toast.success('Employee add ho gaya');
    }
    this.showForm.set(false);
  }

  remove(e: Employee): void {
    this.confirm.ask({
      title: 'Delete employee?',
      message: `"${e.name}" ka record delete ho jayega.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        await this.employeeSvc.remove(e.id);
        this.toast.success('Employee delete ho gaya');
      },
    });
  }

  openPayForm(e: Employee): void {
    this.payForm.reset({ amount: this.remaining(e) });
    this.payingFor.set(e);
  }

  submitPay(): void {
    const emp = this.payingFor();
    if (!emp || this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }
    this.employeeSvc.paySalary(emp.id, this.payForm.getRawValue().amount);
    this.toast.success(`${emp.name} ko salary pay ho gayi`);
    this.payingFor.set(null);
  }
}
