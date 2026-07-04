import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { NotificationService } from '../../core/services/notification.service';
import { Icon, IconName } from '../../shared/ui/icon/icon';

interface NavItem {
  label: string;
  path: string;
  icon: IconName;
  ownerOnly?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  readonly notify = inject(NotificationService);

  readonly sidebarOpen = signal(true); // desktop rail collapse
  readonly mobileOpen = signal(false); // mobile off-canvas drawer
  readonly notifOpen = signal(false); // bell dropdown

  toggleNotif() {
    const opening = !this.notifOpen();
    this.notifOpen.set(opening);
    if (opening) this.notify.markAllRead();
  }

  openNotif(link?: string) {
    this.notifOpen.set(false);
    if (link) this.router.navigateByUrl(link);
  }

  logout() {
    this.auth.logout();
    this.toast.info('Logged out');
    this.router.navigateByUrl('/login');
  }

  private readonly allNav: NavItem[] = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard', ownerOnly: true },
    { label: 'Orders', path: '/admin/orders', icon: 'receipt' },
    { label: 'Inventory', path: '/admin/inventory', icon: 'package', ownerOnly: true },
    { label: 'Products', path: '/admin/products', icon: 'tag', ownerOnly: true },
    { label: 'Vendors', path: '/admin/vendors', icon: 'truck', ownerOnly: true },
    { label: 'Customers', path: '/admin/customers', icon: 'users', ownerOnly: true },
    { label: 'Udhaar Khaata', path: '/admin/udhaar', icon: 'notebook', ownerOnly: true },
    { label: 'Employees', path: '/admin/employees', icon: 'user', ownerOnly: true },
    { label: 'Activity', path: '/admin/activity', icon: 'clock' },
  ];

  /** Staff only see shared items (Orders); owner sees everything. */
  readonly nav = computed(() =>
    this.allNav.filter((n) => this.auth.isOwner() || !n.ownerOnly),
  );

  readonly roleLabel = computed(() => (this.auth.isOwner() ? 'Admin' : 'Staff'));

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }

  toggleMobile() {
    this.mobileOpen.update((v) => !v);
  }

  closeMobile() {
    this.mobileOpen.set(false);
  }
}
