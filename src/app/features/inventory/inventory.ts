import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { Modal } from '../../shared/ui/modal/modal';
import { TextInput } from '../../shared/ui/text-input/text-input';
import { SelectInput, SelectOption } from '../../shared/ui/select-input/select-input';
import { Button } from '../../shared/ui/button/button';
import { ProductService } from '../../core/services/product.service';
import { VendorService } from '../../core/services/vendor.service';
import { ToastService } from '../../core/services/toast.service';
import { Product } from '../../core/models';

@Component({
  selector: 'app-inventory',
  imports: [
    CurrencyPipe, ReactiveFormsModule, PageHeader, StatusBadge, StatCard,
    Modal, TextInput, SelectInput, Button,
  ],
  templateUrl: './inventory.html',
})
export class Inventory {
  private readonly productSvc = inject(ProductService);
  private readonly vendorSvc = inject(VendorService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly products = this.productSvc.products;
  readonly lowStock = this.productSvc.lowStock;
  readonly totalStockValue = this.productSvc.totalStockValue;
  readonly totalProducts = this.productSvc.totalProducts;
  readonly showForm = signal(false);

  readonly productOptions = computed<SelectOption[]>(() =>
    this.products().map((p) => ({ value: p.id, label: `${p.name} (${p.stockQty} ${p.unit})` })),
  );
  readonly vendorOptions = computed<SelectOption[]>(() => [
    { value: '', label: '— None —' },
    ...this.vendorSvc.vendors().map((v) => ({ value: v.id, label: v.name })),
  ]);

  readonly form = this.fb.nonNullable.group({
    productId: ['', Validators.required],
    qty: [0, [Validators.required, Validators.min(1)]],
    unitCost: [0, [Validators.required, Validators.min(0)]],
    vendorId: [''],
  });

  suggestReorder(p: Product): number {
    return Math.max(0, p.reorderLevel * 2 - p.stockQty);
  }

  openForm(): void {
    this.form.reset({ productId: '', qty: 0, unitCost: 0, vendorId: '' });
    this.showForm.set(true);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { productId, qty, unitCost, vendorId } = this.form.getRawValue();
    this.productSvc.stockIn(productId, qty);
    if (vendorId) {
      this.vendorSvc.addPurchase(vendorId, qty * unitCost);
    }
    this.toast.success(`Stock add ho gaya (+${qty})`);
    this.showForm.set(false);
  }
}
