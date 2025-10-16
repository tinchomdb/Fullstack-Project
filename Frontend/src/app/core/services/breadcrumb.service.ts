import { inject, Injectable, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { BreadcrumbItem } from '../models/breadcrumb.model';
import { CategoriesService } from './categories.service';

@Injectable({ providedIn: 'root' })
export class BreadcrumbService {
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoriesService);
  private readonly breadcrumbsState = signal<BreadcrumbItem[]>([]);
  readonly breadcrumbs = this.breadcrumbsState.asReadonly();

  constructor() {
    this.updateBreadcrumbsFromCurrentRoute();
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.updateBreadcrumbsFromCurrentRoute();
    });
  }

  private updateBreadcrumbsFromCurrentRoute(): void {
    const url = this.router.url;
    const urlTree = this.router.parseUrl(url);
    const segments = urlTree.root.children['primary']?.segments || [];
    this.updateBreadcrumbs(segments.map((s) => s.path));
  }

  private updateBreadcrumbs(segments: string[]): void {
    const breadcrumbs = this.buildBreadcrumbs(segments);
    this.breadcrumbsState.set(breadcrumbs);
  }

  updateBreadcrumbsForProductDetailsPage(productName: string, categoryId: string): void {
    const categoryPath = this.categoryService.getCategoryPath(categoryId);
    const categorySegments = categoryPath.map((c) => c.slug);
    const breadcrumbs = this.buildBreadcrumbs(['category', ...categorySegments]);
    breadcrumbs.push({ label: productName });
    this.breadcrumbsState.set(breadcrumbs);
  }

  private buildBreadcrumbs(segments: string[]): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [{ label: 'Home', route: '/products' }];

    if (segments.length === 0 || (segments.length === 1 && segments[0] === 'products')) {
      return breadcrumbs;
    }

    if (segments.length > 0) {
      const firstSegment = segments[0];
      const routeLabels: Record<string, string> = {
        cart: 'Shopping Cart',
        checkout: 'Checkout',
        admin: 'Admin Panel',
        orders: 'Orders',
      };

      if (routeLabels[firstSegment]) {
        breadcrumbs.push({ label: routeLabels[firstSegment] });
      }
    }

    if (segments[0] === 'category' && segments.length > 1) {
      // Build routes that include the 'category' prefix so links become
      // '/category/book', '/category/book/fantasy', etc.
      for (let i = 1; i < segments.length; i++) {
        const path = '/' + segments.slice(0, i + 1).join('/');
        const categoryName =
          this.categoryService.getCategoryBySlug(segments[i])?.name || segments[i];
        breadcrumbs.push({ label: categoryName, route: path });
      }
    }

    return breadcrumbs;
  }
}
