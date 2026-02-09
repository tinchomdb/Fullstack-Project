import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';

import { CategoriesService } from '../../core/services/categories.service';
import { FiltersService } from '../../core/services/filters.service';
import { CartService } from '../../core/services/cart.service';
import { ProductListManager, PRODUCT_LIST_CONFIG } from '../../core/managers/product-list.manager';
import { SORT_OPTIONS } from '../../core/models/sort-option.model';
import { Product } from '../../core/models/product.model';
import { FeaturedProductsComponent } from '../../shared/ui/featured-products/featured-products.component';
import { FeaturedCategoriesComponent } from '../../shared/ui/featured-categories/featured-categories.component';
import { BannerCarouselComponent } from '../../shared/ui/banner-carousel/banner-carousel.component';
import { ProductListSectionComponent } from '../../shared/ui/product-list-section/product-list-section.component';
import { CarouselService } from '../../core/services/carousel.service';

@Component({
  selector: 'app-home',
  imports: [
    FeaturedProductsComponent,
    FeaturedCategoriesComponent,
    BannerCarouselComponent,
    ProductListSectionComponent,
  ],
  providers: [
    ProductListManager,
    { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: true, featuredLimit: 6 } },
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly listManager = inject(ProductListManager);
  private readonly categoriesService = inject(CategoriesService);
  private readonly filtersService = inject(FiltersService);
  private readonly cartService = inject(CartService);
  private readonly carouselService = inject(CarouselService);

  protected readonly products = this.listManager.products;
  protected readonly featuredProducts = this.listManager.featuredProducts;
  protected readonly loadingMore = this.listManager.isLoadingMore;
  protected readonly hasMore = this.listManager.hasMore;

  protected readonly featuredCategories = computed(() => {
    return this.categoriesService.featuredCategories().slice(0, 6);
  });

  // Carousel data
  protected readonly carouselSlides = computed(() => this.carouselService.activeSlides() ?? []);
  protected readonly carouselLoading = computed(() => this.carouselService.activeSlidesLoading());
  protected readonly carouselError = computed(() => this.carouselService.activeSlidesError());

  // Sort state
  protected readonly currentSortValue = this.filtersService.currentSortValue;
  protected readonly sortOptions = SORT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }));

  constructor() {
    this.carouselService.loadActiveSlides();
  }

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
