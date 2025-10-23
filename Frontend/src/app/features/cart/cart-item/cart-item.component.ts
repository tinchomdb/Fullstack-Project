import { Component, input, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';

import { CartItem } from '../../../core/models/cart-item.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { QuantitySelectorComponent } from '../../../shared/ui/quantity-selector/quantity-selector.component';
import { TrashIconComponent } from '../../../shared/ui/icons/trash-icon.component';

@Component({
  selector: 'app-cart-item',
  imports: [ButtonComponent, QuantitySelectorComponent, TrashIconComponent],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemComponent {
  private readonly router = inject(Router);
  item = input.required<CartItem>();
  currency = input.required<string>();

  quantityChange = output<number>();
  remove = output<void>();

  onQuantityChange(newQuantity: number): void {
    this.quantityChange.emit(newQuantity);
  }

  onRemove(): void {
    this.remove.emit();
  }

  onLinkClick(): void {
    this.router.navigate(['/products', this.item().slug]);
  }
}
