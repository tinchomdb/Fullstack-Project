import { ChangeDetectionStrategy, Component, inject, computed, DestroyRef } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, skip } from 'rxjs';

import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { FiltersService } from '../../core/services/filters.service';
import { ProductFeaturedCardComponent } from '../../shared/ui/product-featured-card/product-featured-card.component';
import { ProductGridComponent } from '../../shared/ui/product-grid/product-grid.component';
import { FeaturedCategoriesComponent } from '../../shared/ui/featured-categories/featured-categories.component';
import { BannerCarouselComponent } from '../../shared/ui/banner-carousel/banner-carousel.component';

@Component({
  selector: 'app-products-page',
  imports: [
    ProductFeaturedCardComponent,
    ProductGridComponent,
    FeaturedCategoriesComponent,
    BannerCarouselComponent,
  ],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly filtersService = inject(FiltersService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly headingId = 'products-heading';

  protected readonly activeCategory = computed(() => {
    const categoryId = this.filtersService.categoryId();
    if (!categoryId) return null;

    const categories = this.categoriesService.categories() ?? [];
    return categories.find((c) => c.id === categoryId) ?? null;
  });

  protected readonly loading = computed(
    () => this.productsService.loading() || this.categoriesService.loading(),
  );

  protected readonly error = computed(
    () => this.productsService.error() || this.categoriesService.error(),
  );

  protected readonly products = this.productsService.products;
  protected readonly featuredProduct = this.productsService.featuredProduct;
  protected readonly remainingProducts = this.productsService.remainingProducts;

  protected readonly displayedCategories = computed(() => {
    const category = this.activeCategory();
    if (category) {
      return this.categoriesService.getChildCategories(category.id);
    }
    return this.categoriesService.featuredCategories().slice(0, 6);
  });

  protected readonly pageHeading = computed(() => {
    const category = this.activeCategory();
    return category ? category.name : '';
  });

  constructor() {
    // Convert filters signal to observable and subscribe to changes
    // Skip first emission to avoid loading on init (already loaded by app.ts)
    toObservable(this.filtersService.filters)
      .pipe(
        skip(1), // Skip initial value
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)),
      )
      .subscribe((filters) => {
        this.productsService.loadProducts({
          page: filters.page,
          pageSize: filters.pageSize,
          sortBy: filters.sortBy,
          sortDirection: filters.sortDirection,
          ...(filters.minPrice !== null && { minPrice: filters.minPrice }),
          ...(filters.maxPrice !== null && { maxPrice: filters.maxPrice }),
          ...(filters.categoryId !== null && { categoryId: filters.categoryId }),
        });
      });
  }
}
