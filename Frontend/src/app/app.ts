import { Component, ChangeDetectionStrategy, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/ui/navbar/navbar.component';
import { FooterComponent } from './shared/ui/footer/footer.component';
import { LoadingOverlayComponent } from './core/ui/loading-overlay/loading-overlay.component';
import { AuthService } from './core/auth/auth.service';
import { CategoriesService } from './core/services/categories.service';
import { ProductsService } from './core/services/products.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent, LoadingOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);

  protected readonly title = computed(() => 'Fullstack Marketplace');

  ngOnInit(): void {
    this.categoriesService.loadCategories();
    this.productsService.loadProducts();
  }

  protected readonly navigation = computed(() => {
    const baseNav = [
      {
        label: 'Products',
        path: '/products',
        ariaLabel: 'Browse products',
      },
      {
        label: 'Cart',
        path: '/cart',
        ariaLabel: 'View your shopping cart',
      },
      {
        label: 'Contact',
        path: '/contact',
        ariaLabel: 'Get in touch with us',
      },
    ];

    // Add admin link if user is admin
    if (this.authService.isAdmin()) {
      return [
        ...baseNav,
        {
          label: 'Admin',
          path: '/admin',
          ariaLabel: 'Admin panel',
        },
      ];
    }

    return baseNav;
  });

  protected readonly currentYear = new Date().getFullYear();
}
