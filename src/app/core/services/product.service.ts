import { Injectable, computed, signal } from '@angular/core';
import { Product } from '../models';

/**
 * Phase 1: data is mocked in-memory with signals.
 * Phase 2: replace the seed array with Supabase queries — the public
 * API (signals + methods) stays the same, so components don't change.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly _products = signal<Product[]>([
    { id: 'p1', name: 'Sugar (loose)', category: 'Grocery', costPrice: 130, salePrice: 145, stockQty: 60, reorderLevel: 20, unit: 'kg', minOrder: 1, maxOrder: 20, step: 0.5, isPublished: true },
    { id: 'p2', name: 'Cooking Oil 1L', category: 'Grocery', costPrice: 480, salePrice: 540, stockQty: 12, reorderLevel: 15, unit: 'pcs', minOrder: 1, maxOrder: 12, step: 1, isPublished: true },
    { id: 'p3', name: 'Basmati Rice (loose)', category: 'Grocery', costPrice: 230, salePrice: 258, stockQty: 25, reorderLevel: 10, unit: 'kg', minOrder: 1, maxOrder: 25, step: 0.5, isPublished: true },
    { id: 'p4', name: 'Tea Pack 950g', category: 'Beverages', costPrice: 1100, salePrice: 1250, stockQty: 8, reorderLevel: 12, unit: 'pcs', minOrder: 1, maxOrder: 6, step: 1, isPublished: true },
    { id: 'p5', name: 'Wheat Flour (loose)', category: 'Grocery', costPrice: 130, salePrice: 142, stockQty: 40, reorderLevel: 15, unit: 'kg', minOrder: 1, maxOrder: 40, step: 1, isPublished: true },
    { id: 'p6', name: 'Soap Bar', category: 'Personal Care', costPrice: 95, salePrice: 120, stockQty: 5, reorderLevel: 25, unit: 'pcs', minOrder: 1, maxOrder: 10, step: 1, isPublished: false },
    { id: 'p7', name: 'Milk Pack 1L', category: 'Dairy', costPrice: 190, salePrice: 210, stockQty: 30, reorderLevel: 20, unit: 'pcs', minOrder: 1, maxOrder: 12, step: 1, isPublished: true },
    { id: 'p8', name: 'Salt 800g', category: 'Grocery', costPrice: 40, salePrice: 55, stockQty: 70, reorderLevel: 20, unit: 'pcs', minOrder: 1, maxOrder: 10, step: 1, isPublished: true },
  ]);

  readonly products = this._products.asReadonly();

  readonly lowStock = computed(() =>
    this._products().filter((p) => p.stockQty <= p.reorderLevel),
  );

  readonly totalStockValue = computed(() =>
    this._products().reduce((sum, p) => sum + p.stockQty * p.costPrice, 0),
  );

  readonly totalProducts = computed(() => this._products().length);

  /** Add a new product to the catalog. */
  add(data: Omit<Product, 'id'>): void {
    const product: Product = { ...data, id: crypto.randomUUID() };
    this._products.update((list) => [product, ...list]);
  }

  update(id: string, data: Omit<Product, 'id'>): void {
    this._products.update((list) =>
      list.map((p) => (p.id === id ? { ...data, id } : p)),
    );
  }

  remove(id: string): void {
    this._products.update((list) => list.filter((p) => p.id !== id));
  }

  /** Increase stock for a product (used by Stock In / Purchase). */
  stockIn(productId: string, qty: number): void {
    this._products.update((list) =>
      list.map((p) => (p.id === productId ? { ...p, stockQty: p.stockQty + qty } : p)),
    );
  }
}
