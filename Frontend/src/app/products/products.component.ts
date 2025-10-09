import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';

import { ProductsService } from './products.service';
import { DataStateComponent } from '../shared/ui/data-state/data-state.component';
import { ProductFeaturedCardComponent } from './components/product-featured-card/product-featured-card.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import { SectionHeaderComponent } from '../shared/ui/section-header/section-header.component';

@Component({
  selector: 'app-products-page',
  imports: [
    DataStateComponent,
    ProductFeaturedCardComponent,
    ProductGridComponent,
    SectionHeaderComponent,
  ],
  templateUrl: './products.component.html',
  styleUrl: './products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  private readonly productsService = inject(ProductsService);

  protected readonly headingId = 'products-heading';

  protected readonly products = this.productsService.products;
  protected readonly loading = this.productsService.loading;
  protected readonly error = this.productsService.error;
  protected readonly featuredProduct = this.productsService.featuredProduct;
  protected readonly remainingProducts = this.productsService.remainingProducts;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.productsService.loadProducts();
  }
}
