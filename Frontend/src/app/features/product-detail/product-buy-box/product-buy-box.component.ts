import { Component, ChangeDetectionStrategy, input, output, signal, computed } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { QuantitySelectorComponent } from '../../../shared/ui/quantity-selector/quantity-selector.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { SellerInfoComponent } from '../../../shared/ui/seller-info/seller-info.component';
import { ProductPriceComponent } from '../../../shared/ui/product-price/product-price.component';

@Component({
  selector: 'app-product-buy-box',
  imports: [QuantitySelectorComponent, ButtonComponent, SellerInfoComponent, ProductPriceComponent],
  templateUrl: './product-buy-box.component.html',
  styleUrl: './product-buy-box.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductBuyBoxComponent {
  readonly product = input.required<Product>();
  readonly quantity = input.required<number>();
  readonly addingToCart = input(false);

  readonly quantityChange = output<number>();
  readonly addToCart = output<void>();
  readonly buyNow = output<void>();

  protected readonly inStock = computed(() => {
    const prod = this.product();
    return prod.stock === undefined || prod.stock > 0;
  });

  protected readonly stockText = computed(() => {
    const prod = this.product();
    if (prod.stock === undefined) return 'In Stock';
    if (prod.stock === 0) return 'Out of Stock';
    if (prod.stock < 10) return `Only ${prod.stock} left in stock`;
    return 'In Stock';
  });

  protected readonly priceFormatted = computed(() => {
    const prod = this.product();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: prod.currency || 'USD',
    }).format(prod.price);
  });

  protected onQuantityChange(newQuantity: number): void {
    this.quantityChange.emit(newQuantity);
  }

  protected onAddToCart(): void {
    this.addToCart.emit();
  }

  protected onBuyNow(): void {
    this.buyNow.emit();
  }
}
