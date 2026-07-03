import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { Modal } from '../../shared/ui/modal/modal';
import { TextInput } from '../../shared/ui/text-input/text-input';
import { SelectInput, SelectOption } from '../../shared/ui/select-input/select-input';
import { Button } from '../../shared/ui/button/button';
import { CustomerService } from '../../core/services/customer.service';
import { LedgerService } from '../../core/services/ledger.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-udhaar',
  imports: [
    CurrencyPipe, ReactiveFormsModule, StatCard,
    Modal, TextInput, SelectInput, Button,
  ],
  templateUrl: './udhaar.html',
})
export class Udhaar {
  private readonly customerSvc = inject(CustomerService);
  private readonly ledgerSvc = inject(LedgerService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly totalUdhaar = this.customerSvc.totalUdhaar;
  readonly debtors = computed(() => this.customerSvc.customers().filter((c) => c.udhaarBalance > 0));
  readonly entries = this.ledgerSvc.entries;

  readonly showReceive = signal(false);
  readonly showAdd = signal(false);

  readonly allCustomerOptions = computed<SelectOption[]>(() =>
    this.customerSvc.customers().map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` })),
  );
  readonly debtorOptions = computed<SelectOption[]>(() =>
    this.debtors().map((c) => ({ value: c.id, label: `${c.name} — baqi ${c.udhaarBalance}` })),
  );

  // receive payment (credit)
  readonly receiveForm = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
  });

  // record udhaar (debit) — walk-in ne kya liya
  readonly addForm = this.fb.nonNullable.group({
    customerId: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    note: ['', Validators.required],
  });

  openReceive() {
    this.receiveForm.reset({ customerId: '', amount: 0 });
    this.showReceive.set(true);
  }
  openAdd() {
    this.addForm.reset({ customerId: '', amount: 0, note: '' });
    this.showAdd.set(true);
  }

  submitReceive() {
    if (this.receiveForm.invalid) return this.receiveForm.markAllAsTouched();
    const { customerId, amount } = this.receiveForm.getRawValue();
    const customer = this.customerSvc.byId(customerId);
    if (!customer) return;
    const balanceAfter = Math.max(0, customer.udhaarBalance - amount);
    this.customerSvc.reduceUdhaar(customerId, amount);
    this.ledgerSvc.addCredit(customerId, customer.name, amount, balanceAfter);
    this.toast.success(`${customer.name} se payment mil gayi`);
    this.showReceive.set(false);
  }

  submitAdd() {
    if (this.addForm.invalid) return this.addForm.markAllAsTouched();
    const { customerId, amount, note } = this.addForm.getRawValue();
    const customer = this.customerSvc.byId(customerId);
    if (!customer) return;
    const balanceAfter = customer.udhaarBalance + amount;
    this.customerSvc.addUdhaar(customerId, amount);
    this.ledgerSvc.addDebit(customerId, customer.name, amount, balanceAfter, note);
    this.toast.success(`${customer.name} ka udhaar likh diya`);
    this.showAdd.set(false);
  }
}
