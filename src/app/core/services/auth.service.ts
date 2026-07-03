import { Injectable, computed, inject, signal } from '@angular/core';
import { User } from '../models';
import { CustomerService } from './customer.service';

/**
 * Phase 1: in-memory mock auth. currentUser lives for the session.
 * Phase 2: replace with Supabase Auth — the public API (currentUser,
 * login, register, logout, role getters) stays the same.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly customerSvc = inject(CustomerService);

  private readonly _users = signal<User[]>([
    { id: 'u-owner', name: 'Shop Owner', email: 'owner@shop.pk', password: 'owner123', role: 'owner', phone: '0300-0000000', address: 'Main Market' },
    { id: 'e1', name: 'Imran Shah', email: 'staff@shop.pk', password: 'staff123', role: 'staff', phone: '0300-7778889', address: 'Shop' },
    { id: 'c1', name: 'Ahmed Raza', email: 'ahmed@test.pk', password: '12345', role: 'customer', phone: '0300-1112223', address: 'Gulshan Block 5, Karachi' },
  ]);

  private readonly _currentUser = signal<User | null>(null);
  readonly currentUser = this._currentUser.asReadonly();

  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isOwner = computed(() => this._currentUser()?.role === 'owner');
  readonly isStaff = computed(() => this._currentUser()?.role === 'staff');
  readonly isCustomer = computed(() => this._currentUser()?.role === 'customer');
  readonly isStaffOrOwner = computed(() => this.isOwner() || this.isStaff());

  /** Create a staff login (used when owner adds an employee with credentials).
   *  Returns an error message, or the new user id on success. Pass an id to keep
   *  it in sync with the employee record. */
  addStaff(data: { id?: string; name: string; email: string; password: string; phone: string }): string {
    const exists = this._users().some(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase(),
    );
    if (exists) return 'Ye email pehle se registered hai.';
    const user: User = {
      id: data.id ?? crypto.randomUUID(),
      name: data.name,
      email: data.email,
      password: data.password,
      role: 'staff',
      phone: data.phone,
      address: 'Shop',
    };
    this._users.update((list) => [...list, user]);
    return '';
  }

  removeStaffByName(name: string): void {
    this._users.update((list) =>
      list.filter((u) => !(u.role === 'staff' && u.name === name)),
    );
  }

  /** Returns null on success, or an error message. */
  login(email: string, password: string): string | null {
    const user = this._users().find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!user) return 'Is email se koi account nahi mila.';
    if (user.password !== password) return 'Password ghalat hai.';
    this._currentUser.set(user);
    return null;
  }

  /** Registers a new customer and logs them in. Returns null on success. */
  register(data: Omit<User, 'id' | 'role' | 'password'> & { password: string }): string | null {
    const exists = this._users().some(
      (u) => u.email.toLowerCase() === data.email.trim().toLowerCase(),
    );
    if (exists) return 'Ye email pehle se registered hai.';

    const id = crypto.randomUUID();
    const user: User = { ...data, id, role: 'customer' };
    this._users.update((list) => [...list, user]);

    // reflect in the admin's customer list too — same id keeps udhaar/orders in sync
    this.customerSvc.add(
      {
        name: data.name,
        phone: data.phone,
        address: data.address,
        joinedDate: new Date().toISOString().slice(0, 10),
      },
      id,
    );

    this._currentUser.set(user);
    return null;
  }

  logout(): void {
    this._currentUser.set(null);
  }
}
