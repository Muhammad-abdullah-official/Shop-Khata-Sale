import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Modal } from '../../shared/ui/modal/modal';
import { TextInput } from '../../shared/ui/text-input/text-input';
import { SelectInput, SelectOption } from '../../shared/ui/select-input/select-input';
import { Button } from '../../shared/ui/button/button';
import { Icon } from '../../shared/ui/icon/icon';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../core/services/toast.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { Product } from '../../core/models';

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, ReactiveFormsModule, PageHeader, Modal, TextInput, SelectInput, Button, Icon],
  templateUrl: './products.html',
})
export class Products {
  private readonly productSvc = inject(ProductService);
  private readonly toast = inject(ToastService);
  private readonly confirm = inject(ConfirmService);
  private readonly fb = inject(FormBuilder);

  readonly products = this.productSvc.products;
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);

  /** preview shown in the form (data-URL for a new pick, or the stored URL) */
  readonly imagePreview = signal<string | null>(null);
  private readonly imageFile = signal<File | null>(null);
  private readonly existingUrl = signal<string | null>(null);

  readonly modalTitle = computed(() => (this.editingId() ? 'Edit Product' : 'Add Product'));

  readonly categories: SelectOption[] = [
    { value: 'Grocery', label: 'Grocery' },
    { value: 'Beverages', label: 'Beverages' },
    { value: 'Dairy', label: 'Dairy' },
    { value: 'Personal Care', label: 'Personal Care' },
    { value: 'Other', label: 'Other' },
  ];

  readonly units: SelectOption[] = [
    { value: 'pcs', label: 'Pcs' },
    { value: 'kg', label: 'Kg' },
    { value: 'g', label: 'Gram' },
    { value: 'litre', label: 'Litre' },
    { value: 'bag', label: 'Bag' },
  ];

  /** Sensible order defaults per unit — applied when the owner switches unit. */
  private readonly unitDefaults: Record<string, { min: number; max: number; step: number }> = {
    pcs: { min: 1, max: 12, step: 1 },
    bag: { min: 1, max: 10, step: 1 },
    kg: { min: 0.5, max: 20, step: 0.5 },
    litre: { min: 0.5, max: 20, step: 0.5 },
    g: { min: 50, max: 2000, step: 50 },
  };

  /** Live preview of the quantities a customer will be able to order. */
  readonly qtyPreview = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['Grocery', Validators.required],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    stockQty: [0, [Validators.required, Validators.min(0)]],
    reorderLevel: [10, [Validators.required, Validators.min(0)]],
    unit: ['pcs', Validators.required],
    minOrder: [1, [Validators.required, Validators.min(0)]],
    maxOrder: [10, [Validators.required, Validators.min(1)]],
    step: [1, [Validators.required, Validators.min(0.01)]],
    isPublished: [true],
  });

  constructor() {
    // when owner switches unit → apply sensible min/max/step defaults
    this.form.controls.unit.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((u) => {
        const d = this.unitDefaults[u] ?? { min: 1, max: 10, step: 1 };
        this.form.patchValue({ minOrder: d.min, maxOrder: d.max, step: d.step });
      });

    // keep the live preview in sync with any qty-rule change
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.updatePreview());
  }

  private updatePreview(): void {
    const { minOrder: min, maxOrder: max, step, unit } = this.form.getRawValue();
    if (!step || step <= 0 || max < min) {
      this.qtyPreview.set('—');
      return;
    }
    const vals: number[] = [];
    for (let v = min; v <= max + 1e-9 && vals.length < 200; v += step) {
      vals.push(+v.toFixed(2));
    }
    const shown =
      vals.length <= 6
        ? vals.join(', ')
        : `${vals.slice(0, 3).join(', ')} … ${vals[vals.length - 1]}`;
    this.qtyPreview.set(`${shown} ${unit}  (${vals.length} options)`);
  }

  margin(p: Product): number {
    return p.salePrice - p.costPrice;
  }

  onImageSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return this.toast.error('Sirf image upload karein');
    if (file.size > 3 * 1024 * 1024) return this.toast.error('Image 3MB se choti honi chahiye');
    this.imageFile.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  removeImage() {
    this.imageFile.set(null);
    this.imagePreview.set(null);
    this.existingUrl.set(null);
  }

  openForm(): void {
    this.editingId.set(null);
    // emitEvent:false → don't trigger the unit-default listener on a programmatic reset
    this.form.reset(
      {
        name: '', category: 'Grocery', costPrice: 0, salePrice: 0, stockQty: 0,
        reorderLevel: 10, unit: 'pcs', minOrder: 1, maxOrder: 12, step: 1, isPublished: true,
      },
      { emitEvent: false },
    );
    this.removeImage();
    this.updatePreview();
    this.showForm.set(true);
  }

  openEdit(p: Product): void {
    this.editingId.set(p.id);
    this.form.setValue(
      {
        name: p.name, category: p.category, costPrice: p.costPrice, salePrice: p.salePrice,
        stockQty: p.stockQty, reorderLevel: p.reorderLevel, unit: p.unit,
        minOrder: p.minOrder, maxOrder: p.maxOrder, step: p.step, isPublished: p.isPublished,
      },
      { emitEvent: false },
    );
    this.imageFile.set(null);
    this.existingUrl.set(p.imageUrl ?? null);
    this.imagePreview.set(p.imageUrl ?? null);
    this.updatePreview();
    this.showForm.set(true);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    if (v.maxOrder < v.minOrder) {
      this.toast.error('Max order, min order se kam nahi ho sakta');
      return;
    }
    if (v.step <= 0) {
      this.toast.error('Step 0 se bara hona chahiye');
      return;
    }

    this.saving.set(true);

    // upload a newly picked image; otherwise keep whatever was already stored
    let imageUrl = this.existingUrl() ?? undefined;
    const file = this.imageFile();
    if (file) {
      const url = await this.productSvc.uploadImage(file);
      if (!url) {
        this.saving.set(false);
        this.toast.error('Image upload nahi ho saki');
        return;
      }
      imageUrl = url;
    }
    if (!this.imagePreview()) imageUrl = undefined; // user removed it

    const data = { ...v, imageUrl };
    const id = this.editingId();
    if (id) {
      await this.productSvc.update(id, data);
      this.toast.success('Product update ho gaya');
    } else {
      await this.productSvc.add(data);
      this.toast.success('Product add ho gaya');
    }
    this.saving.set(false);
    this.showForm.set(false);
  }

  remove(p: Product): void {
    this.confirm.ask({
      title: 'Delete product?',
      message: `"${p.name}" delete ho jayega. Ye wapas nahi aayega.`,
      confirmLabel: 'Delete',
      danger: true,
      onConfirm: async () => {
        await this.productSvc.remove(p.id);
        this.toast.success('Product delete ho gaya');
      },
    });
  }
}
