import { ChangeDetectionStrategy, Component, OnInit, inject, computed } from '@angular/core';

import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { DataStateComponent } from '../../shared/ui/data-state/data-state.component';
import { ProductFeaturedCardComponent } from '../../shared/ui/product-featured-card/product-featured-card.component';
import { ProductGridComponent } from '../../shared/ui/product-grid/product-grid.component';
import { SectionHeaderComponent } from '../../shared/ui/section-header/section-header.component';
import { FeaturedCategoriesComponent } from '../../shared/ui/featured-categories/featured-categories.component';

@Component({
  selector: 'app-products-page',
  imports: [
    DataStateComponent,
    ProductFeaturedCardComponent,
    ProductGridComponent,
    SectionHeaderComponent,
    FeaturedCategoriesComponent,
  ],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly headingId = 'products-heading';

  protected readonly products = this.productsService.products;
  protected readonly loading = this.productsService.loading;
  protected readonly error = this.productsService.error;
  protected readonly featuredProduct = this.productsService.featuredProduct;
  protected readonly remainingProducts = this.productsService.remainingProducts;

  protected readonly categories = this.categoriesService.categories;
  protected readonly categoriesLoading = this.categoriesService.loading;
  protected readonly featuredCategories = computed(() =>
    (this.categories() ?? []).filter((c) => c.featured).slice(0, 6),
  );

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.productsService.loadProducts();
    this.categoriesService.loadCategories();
  }
}
