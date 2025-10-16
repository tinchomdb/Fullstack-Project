import { Component, ChangeDetectionStrategy, computed, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/ui/navbar/navbar.component';
import { FooterComponent } from './shared/ui/footer/footer.component';
import { LoadingOverlayComponent } from './shared/ui/loading-overlay/loading-overlay.component';
import { BreadcrumbComponent } from './shared/ui/breadcrumb/breadcrumb.component';
import { CategoriesService } from './core/services/categories.service';
import { ProductsService } from './core/services/products.service';
import { CarouselService } from './core/services/carousel.service';

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
  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(ProductsService);
  private readonly carouselService = inject(CarouselService);

  protected readonly title = computed(() => 'Marketplace');

  ngOnInit(): void {
    this.categoriesService.loadCategories();
    this.productsService.loadProducts();
    this.carouselService.activeSlides();
  }

  protected readonly currentYear = new Date().getFullYear();
}
