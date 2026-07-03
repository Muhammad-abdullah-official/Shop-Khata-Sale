import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { Role } from '../models';
import { IconName } from '../../shared/ui/icon/icon';

export interface Activity {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: string; // "Confirmed order"
  detail: string; // "ORD-1042"
  icon: IconName;
  at: string; // display timestamp
}

/**
 * Audit trail — records WHO did WHAT. Logging lives in the service layer
 * so every code path is covered (never forgotten in a component).
 * The actor is always the currently logged-in user.
 */
@Injectable({ providedIn: 'root' })
export class ActivityService {
  private readonly auth = inject(AuthService);

  private readonly _log = signal<Activity[]>([
    { id: 'a1', actorId: 'e1', actorName: 'Imran Shah', actorRole: 'staff', action: 'Delivered order', detail: 'ORD-1040', icon: 'truck', at: '02 Jul, 04:12 PM' },
    { id: 'a2', actorId: 'u-owner', actorName: 'Shop Owner', actorRole: 'owner', action: 'Received payment', detail: 'PKR 2,000 from Ahmed Raza', icon: 'wallet', at: '02 Jul, 01:05 PM' },
    { id: 'a3', actorId: 'e1', actorName: 'Imran Shah', actorRole: 'staff', action: 'Confirmed order', detail: 'ORD-1041', icon: 'check-circle', at: '01 Jul, 11:30 AM' },
  ]);

  readonly all = this._log.asReadonly();

  forActor(actorId: string): Activity[] {
    return this._log().filter((a) => a.actorId === actorId);
  }

  log(action: string, detail: string, icon: IconName): void {
    const u = this.auth.currentUser();
    if (!u) return;
    this._log.update((list) => [
      {
        id: crypto.randomUUID(),
        actorId: u.id,
        actorName: u.name,
        actorRole: u.role,
        action,
        detail,
        icon,
        at: this.now(),
      },
      ...list,
    ]);
  }

  private now(): string {
    return new Date().toLocaleString('en-GB', {
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }
}
