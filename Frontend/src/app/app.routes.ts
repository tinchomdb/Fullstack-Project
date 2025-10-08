import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

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
    path: '**',
    redirectTo: 'products',
  },
];
