import { Injectable, computed, signal } from '@angular/core';
import { CartItem, Product } from '../models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  readonly count = computed(() => this._items().reduce((n, i) => n + i.qty, 0));
  readonly total = computed(() => this._items().reduce((s, i) => s + i.qty * i.salePrice, 0));

  add(product: Product, qty = product.minOrder): void {
    this._items.update((list) => {
      const existing = list.find((i) => i.productId === product.id);
      if (existing) {
        const next = Math.min(product.maxOrder, existing.qty + qty);
        return list.map((i) => (i.productId === product.id ? { ...i, qty: next } : i));
      }
      return [
        ...list,
        {
          productId: product.id,
          name: product.name,
          salePrice: product.salePrice,
          qty: Math.min(product.maxOrder, qty),
          unit: product.unit,
          step: product.step,
          maxOrder: product.maxOrder,
        },
      ];
    });
  }

  /** Set quantity, clamped to [step, maxOrder]. Below step → remove. */
  setQty(productId: string, qty: number): void {
    this._items.update((list) => {
      const item = list.find((i) => i.productId === productId);
      if (!item) return list;
      const rounded = Math.round(qty / item.step) * item.step;
      if (rounded < item.step) return list.filter((i) => i.productId !== productId);
      const clamped = Math.min(item.maxOrder, rounded);
      return list.map((i) => (i.productId === productId ? { ...i, qty: clamped } : i));
    });
  }

  remove(productId: string): void {
    this._items.update((list) => list.filter((i) => i.productId !== productId));
  }

  clear(): void {
    this._items.set([]);
  }
}
