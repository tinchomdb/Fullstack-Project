import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'products',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () => import('./products/products.component').then((m) => m.ProductsComponent),
    data: {
      title: 'Products',
    },
  },
  {
    path: 'cart',
    loadComponent: () => import('./cart/cart.component').then((m) => m.CartComponent),
    data: {
      title: 'Shopping Cart',
    },
  },
  {
    path: 'checkout',
    loadComponent: () => import('./checkout/checkout.component').then((m) => m.CheckoutComponent),
    canActivate: [MsalGuard],
    data: {
      title: 'Checkout',
    },
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.component').then((m) => m.AdminComponent),
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
          import('./admin/admin-products/admin-products.component').then(
            (m) => m.AdminProductsComponent,
          ),
        data: {
          title: 'Manage Products',
        },
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./admin/admin-categories/admin-categories.component').then(
            (m) => m.AdminCategoriesComponent,
          ),
        data: {
          title: 'Manage Categories',
        },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'products',
  },
];
