import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { CartService } from './cart.service';
import { DataStateComponent } from '../shared/ui/data-state/data-state.component';
import { ButtonComponent } from '../shared/ui/button/button.component';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, DataStateComponent, ButtonComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent {
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);

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

  updateQuantity(productId: string, quantity: number): void {
    this.cartService.updateQuantity(productId, quantity).subscribe({
      error: (error) => console.error('Failed to update quantity:', error),
    });
  }

  removeItem(productId: string): void {
    this.cartService.removeFromCart(productId).subscribe({
      error: (error) => console.error('Failed to remove item:', error),
    });
  }

  clearCart(): void {
    this.cartService.clearCart().subscribe({
      error: (error) => console.error('Failed to clear cart:', error),
    });
  }
}
