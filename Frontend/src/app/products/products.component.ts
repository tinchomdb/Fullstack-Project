import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';

import { Product } from '../models/product.model';
import { ProductsService } from './products.service';
import { DataStateComponent } from '../shared/ui/data-state/data-state.component';
import { ProductFeaturedCardComponent } from './components/product-featured-card/product-featured-card.component';
import { ProductGridComponent } from './components/product-grid/product-grid.component';
import { SectionHeaderComponent } from '../shared/ui/section-header/section-header.component';
import { Resource } from '../shared/utils/resource';

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

  protected readonly productsResource = new Resource<readonly Product[]>([]);
  protected readonly headingId = 'products-heading';

  protected readonly featuredProduct = computed(() => {
    const items = this.productsResource.data() ?? [];
    return items.length ? items[0] : null;
  });

  protected readonly remainingProducts = computed(() => {
    const [, ...rest] = this.productsResource.data() ?? [];
    return rest;
  });

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.productsResource.load(this.productsService.getProducts());
  }
}
