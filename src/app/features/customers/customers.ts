import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { Modal } from '../../shared/ui/modal/modal';
import { TextInput } from '../../shared/ui/text-input/text-input';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { CustomerService } from '../../core/services/customer.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Customer } from '../../core/models';

@Component({
  selector: 'app-customers',
  imports: [CurrencyPipe, ReactiveFormsModule, PageHeader, StatCard, Modal, TextInput, Button, Icon],
  templateUrl: './customers.html',
})
export class Customers {
  private readonly customerSvc = inject(CustomerService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);

  readonly customers = this.customerSvc.customers;
  readonly totalCustomers = this.customerSvc.totalCustomers;
  readonly totalUdhaar = this.customerSvc.totalUdhaar;

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly modalTitle = computed(() => (this.editingId() ? 'Edit Customer' : 'Add Customer'));

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    joinedDate: [new Date().toISOString().slice(0, 10), Validators.required],
  });

  openForm(): void {
    this.editingId.set(null);
    this.form.reset({
      name: '', phone: '', address: '',
      joinedDate: new Date().toISOString().slice(0, 10),
    });
    this.showForm.set(true);
  }

  openEdit(c: Customer): void {
    this.editingId.set(c.id);
    this.form.setValue({ name: c.name, phone: c.phone, address: c.address, joinedDate: c.joinedDate });
    this.showForm.set(true);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const id = this.editingId();
    if (id) {
      this.customerSvc.update(id, { name: v.name, phone: v.phone, address: v.address });
      this.toast.success('Customer update ho gaya');
    } else {
      this.customerSvc.add(v);
      this.toast.success('Customer add ho gaya');
    }
    this.showForm.set(false);
  }

  remove(c: Customer): void {
    this.confirm.ask({
      title: 'Delete customer?',
      message: `"${c.name}" delete ho jayega.` + (c.udhaarBalance > 0 ? ' Dhyan: is par udhaar baqi hai!' : ''),
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        this.customerSvc.remove(c.id);
        this.toast.success('Customer delete ho gaya');
      },
    });
  }
}
