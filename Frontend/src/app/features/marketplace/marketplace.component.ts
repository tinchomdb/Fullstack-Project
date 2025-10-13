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
import { ProductFeaturedCardComponent } from '../../shared/ui/product-featured-card/product-featured-card.component';
import { ProductGridComponent } from '../../shared/ui/product-grid/product-grid.component';
import { FeaturedCategoriesComponent } from '../../shared/ui/featured-categories/featured-categories.component';
import { BannerCarouselComponent } from '../../shared/ui/banner-carousel/banner-carousel.component';
import { SortDropdownComponent } from '../../shared/ui/sort-dropdown/sort-dropdown.component';
import {
  ProductFiltersApiParams,
  ProductSortField,
  SortDirection,
} from '../../core/models/product-filters.model';
import { DEFAULT_SORT_OPTION } from '../../core/models/sort-option.model';
import { FiltersService } from '../../core/services/filters.service';
import { combineLatest, map } from 'rxjs';

const DEFAULT_PAGE_SIZE = 20;

@Component({
  selector: 'app-products-page',
  imports: [
    ProductFeaturedCardComponent,
    ProductGridComponent,
    FeaturedCategoriesComponent,
    BannerCarouselComponent,
    SortDropdownComponent,
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
    effect(() => {
      // Read the signal explicitly here - this is what triggers the effect
      const { categoryPath, queryParams } = this.routeParams();

      // Parse filters without reading any signals
      const filters = this.parseFiltersFromRoute(categoryPath, queryParams);

      this.filtersService.setAllFilters(filters);

      untracked(() => {
        this.productsService.loadProducts(filters);
      });
    });

    effect(() => {
      const filters = this.filtersService.filters(); // Read the signal

      untracked(() => {
        this.productsService.loadProducts(this.filtersService.buildApiParams());
      });
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

    // Parse page
    if (typeof queryParams['page'] === 'string') {
      const page = parseInt(queryParams['page'], 10);
      if (!isNaN(page) && page >= 1) {
        filters.page = page;
      }
    }

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
