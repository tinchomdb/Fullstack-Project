import { Injectable, inject, signal, effect } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { BreadcrumbItem } from '../models/breadcrumb.model';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);

  readonly breadcrumbs = signal<BreadcrumbItem[]>([]);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.updateBreadcrumbs();
    });

    // React to category loading
    effect(() => {
      const categories = this.categoriesService.categories();
      if (categories && categories.length > 0) {
        this.updateBreadcrumbs();
      }
    });

    this.updateBreadcrumbs();
  }

  private updateBreadcrumbs(): void {
    const url = this.router.url;
    const urlTree = this.router.parseUrl(url);
    const segments = urlTree.root.children['primary']?.segments || [];
    const queryParams = urlTree.queryParams;

    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', route: '/products' }];

    // Check if categories are loaded
    const categories = this.categoriesService.categories();
    if (!categories || categories.length === 0) {
      // Categories not loaded yet, set minimal breadcrumb
      this.breadcrumbs.set(breadcrumbs);
      return;
    }

    if (segments.length === 0 || (segments.length === 1 && segments[0].path === 'products')) {
      const categorySlug = queryParams['category'];

      if (categorySlug) {
        // Find category by slug
        const category = categories.find((c) => c.slug === categorySlug);

        if (category) {
          const categoryPath = this.categoriesService.getCategoryPath(category.id);

          if (categoryPath && categoryPath.length > 0) {
            categoryPath.forEach((cat) => {
              breadcrumbs.push({
                label: cat.name,
                route: '/products',
                queryParams: { category: cat.slug },
              });
            });
          }
        }
      }

      // Set breadcrumbs for products/home page (even if just "Home")
      this.breadcrumbs.set(breadcrumbs);
      return;
    } else if (segments.length === 2 && segments[0].path === 'products') {
      const productId = segments[1].path;
      const sellerId = queryParams['sellerId'];
      const categorySlug = queryParams['category'];

      if (productId && sellerId) {
        this.productsService.getProduct(productId, sellerId).subscribe({
          next: (product) => {
            let categoryIdToUse: string | undefined;

            // Try to find category from slug in URL
            if (categorySlug) {
              const category = categories.find((c) => c.slug === categorySlug);
              categoryIdToUse = category?.id;
            }

            // Fallback to product's first category if no URL category
            if (!categoryIdToUse && product.categoryIds.length > 0) {
              categoryIdToUse = product.categoryIds[0];
            }

            if (categoryIdToUse) {
              const categoryPath = this.categoriesService.getCategoryPath(categoryIdToUse);

              categoryPath.forEach((cat) => {
                breadcrumbs.push({
                  label: cat.name,
                  route: '/products',
                  queryParams: { category: cat.slug },
                });
              });
            }

            breadcrumbs.push({
              label: product.name,
            });
            this.breadcrumbs.set([...breadcrumbs]);
          },
          error: () => {
            if (categorySlug) {
              const category = categories.find((c) => c.slug === categorySlug);
              if (category) {
                const categoryPath = this.categoriesService.getCategoryPath(category.id);

                categoryPath.forEach((cat) => {
                  breadcrumbs.push({
                    label: cat.name,
                    route: '/products',
                    queryParams: { category: cat.slug },
                  });
                });
              }
            }

            breadcrumbs.push({
              label: 'Product',
            });
            this.breadcrumbs.set([...breadcrumbs]);
          },
        });
        return;
      }
    } else if (segments.length > 0) {
      const firstSegment = segments[0].path;

      const routeLabels: Record<string, string> = {
        cart: 'Shopping Cart',
        checkout: 'Checkout',
        admin: 'Admin Panel',
        orders: 'Orders',
      };

      if (routeLabels[firstSegment]) {
        breadcrumbs.push({
          label: routeLabels[firstSegment],
        });
      }
    }

    this.breadcrumbs.set(breadcrumbs);
  }
}
