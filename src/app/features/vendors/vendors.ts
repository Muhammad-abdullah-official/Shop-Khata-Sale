import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { Modal } from '../../shared/ui/modal/modal';
import { TextInput } from '../../shared/ui/text-input/text-input';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { VendorService } from '../../core/services/vendor.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Vendor } from '../../core/models';

@Component({
  selector: 'app-vendors',
  imports: [CurrencyPipe, ReactiveFormsModule, PageHeader, StatCard, Modal, TextInput, Button, Icon],
  templateUrl: './vendors.html',
})
export class Vendors {
  private readonly vendorSvc = inject(VendorService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);

  readonly vendors = this.vendorSvc.vendors;
  readonly totalPayable = this.vendorSvc.totalPayable;

  readonly showForm = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly payingFor = signal<Vendor | null>(null);
  readonly modalTitle = computed(() => (this.editingId() ? 'Edit Vendor' : 'Add Vendor'));

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    contactPerson: ['', Validators.required],
    phone: ['', Validators.required],
    address: [''],
    totalPurchased: [0, [Validators.required, Validators.min(0)]],
    totalPaid: [0, [Validators.required, Validators.min(0)]],
  });

  readonly payForm = this.fb.nonNullable.group({
    amount: [0, [Validators.required, Validators.min(1)]],
  });

  openPay(v: Vendor): void {
    this.payForm.reset({ amount: v.balance });
    this.payingFor.set(v);
  }

  submitPay(): void {
    const v = this.payingFor();
    if (!v || this.payForm.invalid) {
      this.payForm.markAllAsTouched();
      return;
    }
    this.vendorSvc.payVendor(v.id, this.payForm.getRawValue().amount);
    this.toast.success(`${v.name} ko payment ho gayi`);
    this.payingFor.set(null);
  }

  openForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', contactPerson: '', phone: '', address: '', totalPurchased: 0, totalPaid: 0 });
    this.showForm.set(true);
  }

  openEdit(v: Vendor): void {
    this.editingId.set(v.id);
    this.form.reset({
      name: v.name, contactPerson: v.contactPerson, phone: v.phone, address: v.address,
      totalPurchased: v.totalPurchased, totalPaid: v.totalPaid,
    });
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
      this.vendorSvc.update(id, { name: v.name, contactPerson: v.contactPerson, phone: v.phone, address: v.address });
      this.toast.success('Vendor update ho gaya');
    } else {
      this.vendorSvc.add(v);
      this.toast.success('Vendor add ho gaya');
    }
    this.showForm.set(false);
  }

  remove(v: Vendor): void {
    this.confirm.ask({
      title: 'Delete vendor?',
      message: `"${v.name}" delete ho jayega.` + (v.balance > 0 ? ' Dhyan: is ko payable baqi hai!' : ''),
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: () => {
        this.vendorSvc.remove(v.id);
        this.toast.success('Vendor delete ho gaya');
      },
    });
  }
}
