import { Routes } from '@angular/router';

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
    path: '**',
    redirectTo: 'products',
  },
];
