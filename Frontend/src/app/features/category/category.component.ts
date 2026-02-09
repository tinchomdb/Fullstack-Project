import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';

import { CategoriesService } from '../../core/services/categories.service';
import { FiltersService } from '../../core/services/filters.service';
import { CartService } from '../../core/services/cart.service';
import { ProductListManager, PRODUCT_LIST_CONFIG } from '../../core/managers/product-list.manager';
import { SORT_OPTIONS } from '../../core/models/sort-option.model';
import { Product } from '../../core/models/product.model';
import { FeaturedProductsComponent } from '../../shared/ui/featured-products/featured-products.component';
import { FeaturedCategoriesComponent } from '../../shared/ui/featured-categories/featured-categories.component';
import { HeadingComponent } from '../../shared/ui/heading/heading.component';
import { ProductListSectionComponent } from '../../shared/ui/product-list-section/product-list-section.component';

@Component({
  selector: 'app-category',
  imports: [
    FeaturedProductsComponent,
    FeaturedCategoriesComponent,
    HeadingComponent,
    ProductListSectionComponent,
  ],
  providers: [
    ProductListManager,
    { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: true, featuredLimit: 6 } },
  ],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryComponent {
  private readonly listManager = inject(ProductListManager);
  private readonly categoriesService = inject(CategoriesService);
  private readonly filtersService = inject(FiltersService);
  private readonly cartService = inject(CartService);

  protected readonly headingId = 'category-heading';

  protected readonly activeCategory = computed(() => {
    const categoryId = this.filtersService.categoryId();
    if (!categoryId) return null;
    return this.categoriesService.getCategoryById(categoryId) ?? null;
  });

  protected readonly loading = computed(
    () => this.listManager.isLoadingInitial() || this.categoriesService.loading(),
  );

  protected readonly error = computed(
    () => this.listManager.error() || this.categoriesService.error(),
  );

  protected readonly products = this.listManager.products;
  protected readonly featuredProducts = this.listManager.featuredProducts;
  protected readonly loadingMore = this.listManager.isLoadingMore;
  protected readonly hasMore = this.listManager.hasMore;

  protected readonly subcategories = computed(() => {
    const category = this.activeCategory();
    if (!category) return [];
    return this.categoriesService.getChildCategories(category.id);
  });

  protected readonly pageHeading = computed(() => {
    const category = this.activeCategory();
    return category ? category.name : 'Category';
  });

  // Sort state
  protected readonly currentSortValue = this.filtersService.currentSortValue;
  protected readonly sortOptions = SORT_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  protected onLoadMore(): void {
    this.listManager.loadMore();
  }

  protected onAddToCart(product: Product): void {
    this.cartService.addToCart(product, 1);
  }

  protected onSortChange(value: string): void {
    this.filtersService.setSortByValue(value);
  }
}
