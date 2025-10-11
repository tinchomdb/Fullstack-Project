import {
  ChangeDetectionStrategy,
  Component,
  inject,
  computed,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, takeUntil } from 'rxjs';

import { ProductsService } from '../../core/services/products.service';
import { CategoriesService } from '../../core/services/categories.service';
import { ProductFeaturedCardComponent } from '../../shared/ui/product-featured-card/product-featured-card.component';
import { ProductGridComponent } from '../../shared/ui/product-grid/product-grid.component';
import { SectionHeaderComponent } from '../../shared/ui/section-header/section-header.component';
import { FeaturedCategoriesComponent } from '../../shared/ui/featured-categories/featured-categories.component';

@Component({
  selector: 'app-products-page',
  imports: [
    ProductFeaturedCardComponent,
    ProductGridComponent,
    SectionHeaderComponent,
    FeaturedCategoriesComponent,
  ],
  templateUrl: './marketplace.component.html',
  styleUrl: './marketplace.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsComponent implements OnInit, OnDestroy {
  private readonly productsService = inject(ProductsService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  protected readonly headingId = 'products-heading';

  private readonly queryParams = toSignal(this.route.queryParams, { initialValue: {} });

  private readonly categorySlug = computed(() => {
    const params = this.queryParams() as Record<string, string>;
    return params['category'];
  });

  protected readonly activeCategory = computed(() => {
    const slug = this.categorySlug();
    if (!slug) return null;

    const categories = this.categoriesService.categories() ?? [];
    return categories.find((c) => c.slug === slug) ?? null;
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

  protected readonly featuredCategories = computed(() =>
    (this.categoriesService.categories() ?? []).filter((c) => c.featured).slice(0, 6),
  );

  protected readonly pageHeading = computed(() => {
    const category = this.activeCategory();
    return category ? category.name : 'Featured products';
  });

  protected readonly pageSubtitle = computed(() => {
    const category = this.activeCategory();
    return category
      ? category.description || `Browse all products in ${category.name}`
      : 'Discover curated items from our top sellers. Updated in real time from the backend API.';
  });

  ngOnInit(): void {
    // Load products based on initial URL (handles page reload with category in URL)
    this.loadProductsBasedOnCategory();

    // Subscribe to query param changes to reload products when category filter changes
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.loadProductsBasedOnCategory();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProductsBasedOnCategory(): void {
    const category = this.activeCategory();
    if (category) {
      this.productsService.loadProductsByCategory(category.id);
    } else {
      this.productsService.reloadProducts();
    }
  }
}
