import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/ui/navbar/navbar.component';
import { FooterComponent } from './shared/ui/footer/footer.component';
import { LoadingOverlayComponent } from './shared/ui/loading-overlay/loading-overlay.component';
import { BreadcrumbComponent } from './shared/ui/breadcrumb/breadcrumb.component';
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
export class App {
  protected readonly title = computed(() => 'Marketplace');

  protected readonly currentYear = new Date().getFullYear();
}
