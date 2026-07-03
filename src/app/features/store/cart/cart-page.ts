import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { Icon } from '../../../shared/ui/icon/icon';

@Component({
  selector: 'app-cart-page',
  imports: [CurrencyPipe, RouterLink, Icon],
  templateUrl: './cart-page.html',
})
export class CartPage {
  readonly cart = inject(CartService);
}
