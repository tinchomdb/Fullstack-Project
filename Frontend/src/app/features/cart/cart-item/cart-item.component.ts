import { Component, input, output, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';

import { CartItem } from '../../../core/models/cart-item.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { QuantitySelectorComponent } from '../../../shared/ui/quantity-selector/quantity-selector.component';
import { TrashIconComponent } from '../../../shared/ui/icons/trash-icon.component';

@Component({
  selector: 'app-cart-item',
  imports: [ButtonComponent, QuantitySelectorComponent, TrashIconComponent, CurrencyPipe],
  templateUrl: './cart-item.component.html',
  styleUrl: './cart-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemComponent {
  private readonly router = inject(Router);
  item = input.required<CartItem>();
  currency = input.required<string>();

  increase = output<void>();
  decrease = output<void>();
  remove = output<void>();

  onIncrease(): void {
    this.increase.emit();
  }

  onDecrease(): void {
    this.decrease.emit();
  }

  onRemove(): void {
    this.remove.emit();
  }

  onLinkClick(): void {
    this.router.navigate(['/products', this.item().slug]);
  }
}
