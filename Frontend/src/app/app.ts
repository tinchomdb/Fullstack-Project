import { Component, ChangeDetectionStrategy, computed, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/ui/navbar/navbar.component';
import { FooterComponent } from './shared/ui/footer/footer.component';
import { LoadingOverlayComponent } from './shared/ui/loading-overlay/loading-overlay.component';
import { BreadcrumbComponent } from './shared/ui/breadcrumb/breadcrumb.component';
import { AuthService } from './core/auth/auth.service';
import { CategoriesService } from './core/services/categories.service';
import { ProductsService } from './core/services/products.service';
import { CarouselService } from './core/services/carousel.service';
import { BreadcrumbService } from './core/services/breadcrumb.service';

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
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly carouselService = inject(CarouselService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  protected readonly title = computed(() => 'Fullstack Marketplace');

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.updateBreadcrumbs();
    });
  }

  ngOnInit(): void {
    this.categoriesService.loadCategories();
    this.productsService.loadProducts();
    this.carouselService.activeSlides();
    this.updateBreadcrumbs();
  }

  private updateBreadcrumbs(): void {
    const url = this.router.url;
    const urlTree = this.router.parseUrl(url);
    const segments = urlTree.root.children['primary']?.segments || [];
    this.breadcrumbService.updateBreadcrumbs(segments.map((s) => s.path));
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
