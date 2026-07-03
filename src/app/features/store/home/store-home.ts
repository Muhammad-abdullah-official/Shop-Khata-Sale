import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../../shared/ui/icon/icon';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models';

@Component({
  selector: 'app-store-home',
  imports: [CurrencyPipe, FormsModule, Icon],
  templateUrl: './store-home.html',
})
export class StoreHome {
  private readonly productSvc = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);

  readonly search = signal('');
  readonly activeCategory = signal('All');

  /** per-card selected quantity (defaults to each product's minOrder) */
  private readonly qtyMap = signal<Record<string, number>>({});

  private readonly published = computed(() => this.productSvc.products().filter((p) => p.isPublished));

  readonly categories = computed(() => [
    'All',
    ...Array.from(new Set(this.published().map((p) => p.category))),
  ]);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.activeCategory();
    return this.published().filter(
      (p) =>
        (cat === 'All' || p.category === cat) &&
        (q === '' || p.name.toLowerCase().includes(q)),
    );
  });

  qtyOf(p: Product): number {
    return this.qtyMap()[p.id] ?? p.minOrder;
  }

  private setQty(p: Product, val: number) {
    const clamped = Math.min(p.maxOrder, Math.max(p.minOrder, +val.toFixed(2)));
    this.qtyMap.update((m) => ({ ...m, [p.id]: clamped }));
  }

  inc(p: Product) {
    this.setQty(p, this.qtyOf(p) + p.step);
  }
  dec(p: Product) {
    this.setQty(p, this.qtyOf(p) - p.step);
  }

  addToCart(p: Product) {
    this.cart.add(p, this.qtyOf(p));
    this.toast.success(`${this.qtyOf(p)} ${p.unit} ${p.name} — cart me add`);
  }
}
