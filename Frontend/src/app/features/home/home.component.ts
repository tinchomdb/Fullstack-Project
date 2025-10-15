import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';

import { CategoriesService } from '../../core/services/categories.service';
import { ProductListManager, PRODUCT_LIST_CONFIG } from '../../core/managers/product-list.manager';
import { FeaturedProductsComponent } from '../../shared/ui/featured-products/featured-products.component';
import { FeaturedCategoriesComponent } from '../../shared/ui/featured-categories/featured-categories.component';
import { BannerCarouselComponent } from '../../shared/ui/banner-carousel/banner-carousel.component';
import { ProductListSectionComponent } from '../../shared/ui/product-list-section/product-list-section.component';

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

  protected readonly featuredCategories = computed(() => {
    return this.categoriesService.featuredCategories().slice(0, 6);
  });

  protected onLoadMore(): void {
    this.listManager.loadMore();
  }
}
