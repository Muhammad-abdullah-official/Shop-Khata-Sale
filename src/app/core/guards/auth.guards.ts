import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Owner-only pages (dashboard, products, vendors, employees, udhaar…). */
export const ownerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isOwner()) return true;
  // staff landing on an owner page → send to their orders
  if (auth.isStaff()) return router.createUrlTree(['/admin/orders']);
  return router.createUrlTree(['/login'], { queryParams: { role: 'owner' } });
};

/** Admin shell + Orders — owner OR staff. */
export const staffGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isStaffOrOwner()) return true;
  return router.createUrlTree(['/login']);
};

/** Customer account pages — must be a logged-in customer. */
export const customerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isCustomer()) return true;
  return router.createUrlTree(['/login']);
};
