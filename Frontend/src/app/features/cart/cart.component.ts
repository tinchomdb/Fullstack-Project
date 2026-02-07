import { Component, inject, ChangeDetectionStrategy } from '@angular/core';

import { Router } from '@angular/router';

import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/auth/auth.service';
import { ButtonComponent } from '../../shared/ui/button/button.component';
import { CartItemComponent } from './cart-item/cart-item.component';
import { OrderSummaryPanelComponent } from '../../shared/ui/order-summary-panel/order-summary-panel.component';
import { SidebarLayoutComponent } from '../../shared/layouts/sidebar-layout/sidebar-layout.component';
import { CartIconComponent } from '../../shared/ui/icons/cart-icon.component';

@Component({
  selector: 'app-cart',
  imports: [
    ButtonComponent,
    CartItemComponent,
    OrderSummaryPanelComponent,
    SidebarLayoutComponent,
    CartIconComponent,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Reactive state from service
  protected readonly cart = this.cartService.cart;
  protected readonly loading = this.cartService.loading;
  protected readonly error = this.cartService.error;
  protected readonly isEmpty = this.cartService.isEmpty;
  protected readonly itemCount = this.cartService.itemCount;
  protected readonly totalAmount = this.cartService.totalAmount;

  reload(): void {
    this.cartService.loadCart();
  }

  checkout(): void {
    this.router.navigate(['/checkout']);
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity);
  }

  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId);
  }

  clearCart(): void {
    this.cartService.clearCart();
  }
}
