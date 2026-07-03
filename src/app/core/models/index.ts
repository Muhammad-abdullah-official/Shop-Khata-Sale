/**
 * Domain models — the shape of every entity in the app.
 * These stay identical whether data comes from mock services (Phase 1)
 * or Supabase (Phase 2). Components only ever depend on these.
 */

export type Role = 'owner' | 'staff' | 'customer';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string; // Phase 1 mock only — Phase 2 Supabase Auth (never store plain passwords)
  role: Role;
  phone: string;
  address: string;
}

export interface CartItem {
  productId: string;
  name: string;
  salePrice: number;
  qty: number;
  unit: string;
  step: number;
  maxOrder: number;
}

export type PaymentMethod = 'manual_transfer' | 'cod' | 'udhaar' | 'card_gateway';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'udhaar' | 'refunded';
export type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';
export type OrderType = 'online' | 'counter';

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  totalPurchased: number;
  totalPaid: number;
  balance: number; // totalPurchased - totalPaid
}

export interface Category {
  id: string;
  name: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  costPrice: number;
  salePrice: number;
  stockQty: number;
  reorderLevel: number;
  unit: string; // pcs | kg | g | litre ...
  minOrder: number; // customer min order qty (in `unit`)
  maxOrder: number; // customer max order qty
  step: number; // increment (e.g. 0.25 kg, 1 pcs)
  imageUrl?: string; // optional — owner add kare to dikhe
  isPublished: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  qty: number;
  salePrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  customerId: string | null;
  customerName: string;
  type: OrderType;
  date: string;
  items: OrderItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  deliveryAddress: string;
  paymentProofUrl?: string; // screenshot (data URL) for manual_transfer
  cancelRequested?: boolean; // customer requested cancel; owner must approve refund
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  udhaarBalance: number;
  joinedDate: string;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  monthlySalary: number;
  paidThisMonth: number;
  joinDate: string;
  active: boolean;
}

export interface LedgerEntry {
  id: string;
  customerId: string;
  customerName: string;
  type: 'debit' | 'credit'; // debit = udhaar diya, credit = payment aaya
  amount: number;
  balanceAfter: number;
  date: string;
  note: string;
}
