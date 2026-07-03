import { Routes } from '@angular/router';
import { ownerGuard, staffGuard, customerGuard } from './core/guards/auth.guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'store' },

  // ---------- Auth ----------
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },

  // ---------- Customer store ----------
  {
    path: 'store',
    loadComponent: () =>
      import('./layouts/store-layout/store-layout').then((m) => m.StoreLayout),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import('./features/store/home/store-home').then((m) => m.StoreHome) },
      { path: 'cart', loadComponent: () => import('./features/store/cart/cart-page').then((m) => m.CartPage) },
      { path: 'checkout', canActivate: [customerGuard], loadComponent: () => import('./features/store/checkout/checkout').then((m) => m.Checkout) },
      { path: 'order-success/:id', loadComponent: () => import('./features/store/order-success/order-success').then((m) => m.OrderSuccess) },
      { path: 'account', canActivate: [customerGuard], loadComponent: () => import('./features/store/account/account').then((m) => m.Account) },
    ],
  },

  // ---------- Admin (owner only) ----------
  {
    path: 'admin',
    canActivate: [staffGuard],
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout').then((m) => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      // Orders + Activity — owner + staff
      { path: 'orders', loadComponent: () => import('./features/orders/orders').then((m) => m.Orders) },
      { path: 'activity', loadComponent: () => import('./features/activity/activity').then((m) => m.ActivityLog) },
      // Owner-only
      { path: 'dashboard', canActivate: [ownerGuard], loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard) },
      { path: 'inventory', canActivate: [ownerGuard], loadComponent: () => import('./features/inventory/inventory').then((m) => m.Inventory) },
      { path: 'products', canActivate: [ownerGuard], loadComponent: () => import('./features/products/products').then((m) => m.Products) },
      { path: 'vendors', canActivate: [ownerGuard], loadComponent: () => import('./features/vendors/vendors').then((m) => m.Vendors) },
      { path: 'customers', canActivate: [ownerGuard], loadComponent: () => import('./features/customers/customers').then((m) => m.Customers) },
      { path: 'udhaar', canActivate: [ownerGuard], loadComponent: () => import('./features/udhaar/udhaar').then((m) => m.Udhaar) },
      { path: 'employees', canActivate: [ownerGuard], loadComponent: () => import('./features/employees/employees').then((m) => m.Employees) },
    ],
  },

  { path: '**', redirectTo: 'store' },
];
