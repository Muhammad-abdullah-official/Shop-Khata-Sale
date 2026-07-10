import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Session restore is async (Supabase reads it from storage), so every guard
 * awaits `whenReady()` first — otherwise a hard refresh would bounce the
 * user to /login before the session has loaded.
 */

/** Owner-only pages (dashboard, products, vendors, employees, udhaar…). */
export const ownerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  if (auth.isOwner()) return true;
  if (auth.isStaff()) return router.createUrlTree(['/admin/orders']);
  return router.createUrlTree(['/login'], { queryParams: { role: 'owner' } });
};

/** Admin shell + Orders — owner OR staff. */
export const staffGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  if (auth.isStaffOrOwner()) return true;
  return router.createUrlTree(['/login']);
};

/** Customer account pages — must be a logged-in customer. */
export const customerGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.whenReady();
  if (auth.isCustomer()) return true;
  return router.createUrlTree(['/login']);
};
