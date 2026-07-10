import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Product } from '../models';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

const TABLE = 'products';

function toProduct(r: Record<string, any>): Product {
  return {
    id: r['id'],
    name: r['name'],
    category: r['category'],
    costPrice: Number(r['cost_price']),
    salePrice: Number(r['sale_price']),
    stockQty: Number(r['stock_qty']),
    reorderLevel: Number(r['reorder_level']),
    unit: r['unit'],
    minOrder: Number(r['min_order']),
    maxOrder: Number(r['max_order']),
    step: Number(r['step']),
    imageUrl: r['image_url'] ?? undefined,
    isPublished: r['is_published'],
  };
}

function toRow(p: Omit<Product, 'id'>) {
  return {
    name: p.name,
    category: p.category,
    cost_price: p.costPrice,
    sale_price: p.salePrice,
    stock_qty: p.stockQty,
    reorder_level: p.reorderLevel,
    unit: p.unit,
    min_order: p.minOrder,
    max_order: p.maxOrder,
    step: p.step,
    image_url: p.imageUrl ?? null,
    is_published: p.isPublished,
  };
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);

  private readonly _products = signal<Product[]>([]);
  readonly products = this._products.asReadonly();
  readonly loading = signal(false);

  readonly lowStock = computed(() =>
    this._products().filter((p) => p.stockQty <= p.reorderLevel),
  );
  readonly totalStockValue = computed(() =>
    this._products().reduce((sum, p) => sum + p.stockQty * p.costPrice, 0),
  );
  readonly totalProducts = computed(() => this._products().length);

  constructor() {
    // reload whenever the signed-in user changes (RLS changes what's visible)
    effect(() => {
      this.auth.currentUser();
      void this.load();
    });
  }

  async load(): Promise<void> {
    this.loading.set(true);
    const { data, error } = await this.supabase.client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    this.loading.set(false);
    if (error || !data) return;
    this._products.set(data.map(toProduct));
  }

  async add(data: Omit<Product, 'id'>): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).insert(toRow(data));
    if (!error) await this.load();
  }

  async update(id: string, data: Omit<Product, 'id'>): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).update(toRow(data)).eq('id', id);
    if (!error) await this.load();
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.supabase.client.from(TABLE).delete().eq('id', id);
    if (!error) await this.load();
  }

  /** Atomic stock change (negative to deduct). Uses an RPC to avoid lost updates. */
  async stockIn(productId: string, qty: number): Promise<void> {
    const { error } = await this.supabase.client.rpc('adjust_stock', {
      p_id: productId,
      p_delta: qty,
    });
    if (!error) await this.load();
  }

  /** Upload a product image to storage, returns its public URL. */
  async uploadImage(file: File): Promise<string | null> {
    const path = await this.supabase.upload('product-images', file);
    return path ? this.supabase.publicUrl('product-images', path) : null;
  }
}
