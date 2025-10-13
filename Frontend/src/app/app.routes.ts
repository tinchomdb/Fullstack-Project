import { Routes, UrlSegment, UrlMatchResult } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { adminGuard } from './core/auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./features/marketplace/marketplace.component').then((m) => m.MarketplaceComponent),
    data: {
      title: 'Products',
    },
  },
  {
    path: 'products/:slug',
    loadComponent: () =>
      import('./features/product-detail/product-detail.component').then(
        (m) => m.ProductDetailComponent,
      ),
    data: {
      title: 'Product Details',
    },
  },
  // Matcher route - captures any number of segments after 'category' and provides
  // them as a single 'categoryPath' parameter (e.g. 'books/fantasy')
  {
    matcher: (segments: UrlSegment[]): UrlMatchResult | null => {
      if (segments.length === 0) return null;
      // first segment must be 'category'
      if (segments[0].path !== 'category') return null;

      // if there's only 'category' (no extra segments), do not match here
      if (segments.length === 1) return null;

      const rest = segments
        .slice(1)
        .map((s) => s.path)
        .join('/');

      return {
        consumed: segments,
        posParams: {
          categoryPath: new UrlSegment(rest, {}),
        },
      };
    },
    loadComponent: () =>
      import('./features/marketplace/marketplace.component').then((m) => m.MarketplaceComponent),
    data: { title: 'Category' },
  },
  {
    path: 'category',
    loadComponent: () =>
      import('./features/marketplace/marketplace.component').then((m) => m.MarketplaceComponent),
    data: {
      title: 'Products',
    },
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then((m) => m.CartComponent),
    data: {
      title: 'Shopping Cart',
    },
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent),
    canActivate: [MsalGuard],
    data: {
      title: 'Checkout',
    },
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then((m) => m.AdminComponent),
    canActivate: [adminGuard],
    data: {
      title: 'Admin Panel',
    },
    children: [
      {
        path: '',
        redirectTo: 'products',
        pathMatch: 'full',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/admin-products/admin-products.component').then(
            (m) => m.AdminProductsComponent,
          ),
        data: {
          title: 'Manage Products',
        },
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/admin-categories/admin-categories.component').then(
            (m) => m.AdminCategoriesComponent,
          ),
        data: {
          title: 'Manage Categories',
        },
      },
      {
        path: 'carousel',
        loadComponent: () =>
          import('./features/admin/admin-carousel/admin-carousel.component').then(
            (m) => m.AdminCarouselComponent,
          ),
        data: {
          title: 'Manage Carousel',
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'products',
  },
];
