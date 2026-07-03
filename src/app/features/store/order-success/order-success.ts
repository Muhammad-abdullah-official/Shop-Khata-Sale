import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-order-success',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './order-success.html',
})
export class OrderSuccess {
  // route param binding (Angular withComponentInputBinding)
  readonly id = input<string>('');
  private readonly orderSvc = inject(OrderService);

  readonly order = () => this.orderSvc.orders().find((o) => o.id === this.id());
}
