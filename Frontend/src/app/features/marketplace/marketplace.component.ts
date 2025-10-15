import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  effect,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params } from '@angular/router';

import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { FeaturedProductsComponent } from '../../shared/ui/featured-products/featured-products.component';
import { ProductGridComponent } from '../../shared/ui/product-grid/product-grid.component';
import { FeaturedCategoriesComponent } from '../../shared/ui/featured-categories/featured-categories.component';
import { BannerCarouselComponent } from '../../shared/ui/banner-carousel/banner-carousel.component';
import { SortDropdownComponent } from '../../shared/ui/sort-dropdown/sort-dropdown.component';
import { IntersectionObserverDirective } from '../../shared/ui/intersection-observer.directive';
import {
  ProductFiltersApiParams,
  ProductSortField,
  SortDirection,
} from '../../core/models/product-filters.model';
import { DEFAULT_SORT_OPTION } from '../../core/models/sort-option.model';
import { FiltersService } from '../../core/services/filters.service';
import { combineLatest, map } from 'rxjs';
import { HeadingComponent } from '../../shared/ui/heading/heading.component';

const DEFAULT_PAGE_SIZE = 4;

@Component({
  selector: 'app-products-page',
  imports: [
    FeaturedProductsComponent,
    ProductGridComponent,
    FeaturedCategoriesComponent,
    BannerCarouselComponent,
    SortDropdownComponent,
    IntersectionObserverDirective,
    HeadingComponent,
  ],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarketplaceComponent {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly filtersService = inject(FiltersService);
  private readonly route = inject(ActivatedRoute);

  protected readonly headingId = 'products-heading';

  protected readonly activeCategory = computed(() => {
    const filters = this.filtersService.filters();
    if (!filters.categoryId) return null;
    return this.categoriesService.getCategoryById(filters.categoryId) ?? null;
  });

  protected readonly loading = computed(
    () => this.productsService.loading() || this.categoriesService.loading(),
  );

  protected readonly error = computed(
    () => this.productsService.error() || this.categoriesService.error(),
  );

  protected readonly products = this.productsService.products;
  protected readonly featuredProduct = this.productsService.featuredProducts;
  protected readonly loadingMore = this.productsService.loadingMore;
  protected readonly hasMore = this.productsService.hasMore;

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

  private readonly routeParams = toSignal(
    combineLatest([this.route.url, this.route.queryParams]).pipe(
      map(([urlSegments, queryParams]) => {
        // Extract path from URL segments (everything in the component's route)
        const categoryPath = urlSegments.map((segment) => segment.path).join('/') || null;

        return {
          categoryPath,
          queryParams: queryParams as Params,
        };
      }),
    ),
    { initialValue: { categoryPath: null, queryParams: {} as Params } },
  );

  constructor() {
    // Handle route changes - this sets up initial filters and loads products
    effect(() => {
      const { categoryPath, queryParams } = this.routeParams();
      const filters = this.parseFiltersFromRoute(categoryPath, queryParams);

      untracked(() => {
        this.filtersService.setAllFilters(filters);
        this.productsService.loadProducts(filters);
        this.productsService.loadFeaturedProducts(filters.categoryId, 6);
      });
    });

    // Handle filter changes (sort, price, category) - but NOT page changes
    // Track individual filter signals to avoid page dependency
    const filtersWithoutPage = computed(() => ({
      categoryId: this.filtersService.categoryId(),
      minPrice: this.filtersService.minPrice(),
      maxPrice: this.filtersService.maxPrice(),
      sortBy: this.filtersService.sortBy(),
      sortDirection: this.filtersService.sortDirection(),
      searchTerm: this.filtersService.searchTerm(),
    }));

    effect(() => {
      const filters = filtersWithoutPage();

      untracked(() => {
        // Skip the initial run (currentPage will be 0)
        if (this.productsService.currentPage() === 0) return;

        // Reset to page 1 and reload when filters change
        this.filtersService.resetToFirstPage();
        this.productsService.loadProducts(this.filtersService.buildApiParams());
      });
    });
  }

  protected onLoadMore(): void {
    if (this.loadingMore() || !this.hasMore()) return;

    this.filtersService.loadNextPage();

    untracked(() => {
      this.productsService.loadMoreProducts(this.filtersService.buildApiParams());
    });
  }

  private parseFiltersFromRoute(
    categoryPath: string | null,
    queryParams: Params,
  ): ProductFiltersApiParams {
    const category = categoryPath ? this.categoriesService.getCategoryByPath(categoryPath) : null;
    const categoryId = category?.id ?? undefined;

    const filters: ProductFiltersApiParams = {
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      sortBy: DEFAULT_SORT_OPTION.sortBy,
      sortDirection: DEFAULT_SORT_OPTION.sortDirection,
    };

    // Parse minPrice
    if (typeof queryParams['minPrice'] === 'string') {
      const minPrice = parseFloat(queryParams['minPrice']);
      if (!isNaN(minPrice) && minPrice >= 0) {
        filters.minPrice = minPrice;
      }
    }

    // Parse maxPrice
    if (typeof queryParams['maxPrice'] === 'string') {
      const maxPrice = parseFloat(queryParams['maxPrice']);
      if (!isNaN(maxPrice) && maxPrice >= 0) {
        filters.maxPrice = maxPrice;
      }
    }

    // Parse sort
    const sortBy = queryParams['sortBy'];
    const sortDirection = queryParams['sortDirection'];
    if (
      (sortBy === 'name' || sortBy === 'price') &&
      (sortDirection === 'asc' || sortDirection === 'desc')
    ) {
      filters.sortBy = sortBy as ProductSortField;
      filters.sortDirection = sortDirection as SortDirection;
    }

    // Add category if present

    filters.categoryId = categoryId;

    return filters;
  }
}
