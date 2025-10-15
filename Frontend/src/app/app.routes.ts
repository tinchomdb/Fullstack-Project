import { Routes, UrlSegment, UrlMatchResult } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { adminGuard } from './core/auth/admin.guard';
import { filtersResolver } from './core/resolvers/filters.resolver';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    resolve: { filters: filtersResolver },
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
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
  {
    path: 'search',
    loadComponent: () =>
      import('./features/search-results/search-results.component').then(
        (m) => m.SearchResultsComponent,
      ),
    resolve: { filters: filtersResolver },
    runGuardsAndResolvers: 'paramsOrQueryParamsChange',
    data: {
      title: 'Search Results',
    },
  },
  {
    path: 'category',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/category/category.component').then((m) => m.CategoryComponent),
        resolve: { filters: filtersResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        data: {
          title: 'Products',
        },
      },
      {
        path: '**',
        loadComponent: () =>
          import('./features/category/category.component').then((m) => m.CategoryComponent),
        resolve: { filters: filtersResolver },
        runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        data: { title: 'Category' },
      },
    ],
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
