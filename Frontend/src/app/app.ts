import { Component, ChangeDetectionStrategy, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/ui/navbar/navbar.component';
import { FooterComponent } from './shared/ui/footer/footer.component';
import { LoadingOverlayComponent } from './shared/ui/loading-overlay/loading-overlay.component';
import { BreadcrumbComponent } from './shared/ui/breadcrumb/breadcrumb.component';
import { AuthService } from './core/auth/auth.service';
import { CategoriesService } from './core/services/categories.service';
import { ProductsService } from './core/services/products.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    NavbarComponent,
    FooterComponent,
    LoadingOverlayComponent,
    BreadcrumbComponent,
  ],
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
    interface NavigationItem {
      label: string;
      path: string;
      ariaLabel: string;
    }

    const baseNav: NavigationItem[] = [];

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
