import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { ProductPriceComponent } from '../../../shared/ui/product-price/product-price.component';
import { StockStatusComponent } from '../../../shared/ui/stock-status/stock-status.component';
import { SellerInfoComponent } from '../../../shared/ui/seller-info/seller-info.component';

@Component({
  selector: 'app-product-info',
  imports: [ProductPriceComponent, StockStatusComponent, SellerInfoComponent],
  templateUrl: './product-info.component.html',
  styleUrl: './product-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductInfoComponent {
  readonly product = input.required<Product>();
}
