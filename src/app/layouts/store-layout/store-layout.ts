import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { Icon } from '../../shared/ui/icon/icon';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icon],
  templateUrl: './store-layout.html',
})
export class StoreLayout {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly menuOpen = signal(false);

  logout() {
    this.auth.logout();
    this.menuOpen.set(false);
    this.toast.info('Logged out');
    this.router.navigateByUrl('/store');
  }
}
