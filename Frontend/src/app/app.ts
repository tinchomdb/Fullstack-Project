import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './shared/ui/navbar/navbar.component';
import { FooterComponent } from './shared/ui/footer/footer.component';
import { LoadingOverlayComponent } from './shared/ui/loading-overlay/loading-overlay.component';
import { BreadcrumbComponent } from './shared/ui/breadcrumb/breadcrumb.component';
import { CartService } from './core/services/cart.service';
import { CategoriesService } from './core/services/categories.service';

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
export class App {
  private readonly router = inject(Router);
  private readonly cartService = inject(CartService);
  private readonly categoriesService = inject(CategoriesService);

  protected readonly title = computed(() => 'Marketplace');
  protected readonly currentYear = new Date().getFullYear();
  protected readonly cartItemCount = this.cartService.itemCount;
  protected readonly categories = this.categoriesService.categories;

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
