import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatCard } from '../../shared/components/stat-card/stat-card';
import { StatusBadge } from '../../shared/components/status-badge/status-badge';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { Icon } from '../../shared/ui/icon/icon';
import { OrderService } from '../../core/services/order.service';
import { ProductService } from '../../core/services/product.service';
import { CustomerService } from '../../core/services/customer.service';
import { VendorService } from '../../core/services/vendor.service';
import { EmployeeService } from '../../core/services/employee.service';

@Component({
  selector: 'app-dashboard',
  imports: [CurrencyPipe, RouterLink, StatCard, StatusBadge, PageHeader, Icon],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly orderSvc = inject(OrderService);
  private readonly productSvc = inject(ProductService);
  private readonly customerSvc = inject(CustomerService);
  private readonly vendorSvc = inject(VendorService);
  private readonly employeeSvc = inject(EmployeeService);

  // money
  readonly todaySales = this.orderSvc.todaySales;
  readonly monthSales = this.orderSvc.monthSales;
  readonly estimatedProfit = this.orderSvc.estimatedProfit;
  readonly avgOrderValue = this.orderSvc.avgOrderValue;

  // receivables / payables
  readonly totalUdhaar = this.customerSvc.totalUdhaar;
  readonly totalPayable = this.vendorSvc.totalPayable;
  readonly salaryDue = this.employeeSvc.salaryDue;
  readonly totalCustomers = this.customerSvc.totalCustomers;

  // ops
  readonly pendingOrders = this.orderSvc.pendingOrders;
  readonly totalOrders = this.orderSvc.totalOrdersCount;
  readonly deliveredCount = this.orderSvc.deliveredCount;
  readonly recentOrders = this.orderSvc.orders;
  readonly lowStock = this.productSvc.lowStock;
  readonly stockValue = this.productSvc.totalStockValue;
}
