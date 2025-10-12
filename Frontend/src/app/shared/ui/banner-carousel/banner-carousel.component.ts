import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';

import { NavigationArrowComponent } from '../navigation-arrow/navigation-arrow.component';
import { CarouselService } from '../../../core/services/carousel.service';

@Component({
  selector: 'app-banner-carousel',
  imports: [NavigationArrowComponent],
  templateUrl: './banner-carousel.component.html',
  styleUrl: './banner-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  private readonly carouselService = inject(CarouselService);
  private autoRotateInterval?: number;
  private readonly autoRotateDelay = 5000;

  protected readonly slides = this.carouselService.activeSlides;

  protected readonly currentIndex = signal(0);
  protected readonly previousIndex = signal<number | null>(null);
  protected readonly isTransitioning = signal(false);

  protected readonly currentSlide = computed(() => this.slides()[this.currentIndex()]);

  ngOnInit(): void {
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
  }

  protected goToNext(): void {
    if (this.isTransitioning()) return;

    this.isTransitioning.set(true);
    this.previousIndex.set(this.currentIndex());
    this.currentIndex.update((index) => (index + 1) % this.slides().length);

    // Reset transition flag and previous index after animation completes
    setTimeout(() => {
      this.isTransitioning.set(false);
      this.previousIndex.set(null);
    }, 500);

    // Reset auto-rotate timer
    this.resetAutoRotate();
  }

  protected goToPrevious(): void {
    if (this.isTransitioning()) return;

    this.isTransitioning.set(true);
    this.previousIndex.set(this.currentIndex());
    this.currentIndex.update((index) => (index - 1 + this.slides().length) % this.slides().length);

    // Reset transition flag and previous index after animation completes
    setTimeout(() => {
      this.isTransitioning.set(false);
      this.previousIndex.set(null);
    }, 500);

    // Reset auto-rotate timer
    this.resetAutoRotate();
  }

  private startAutoRotate(): void {
    this.autoRotateInterval = window.setInterval(() => {
      this.goToNext();
    }, this.autoRotateDelay);
  }

  private stopAutoRotate(): void {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
      this.autoRotateInterval = undefined;
    }
  }

  private resetAutoRotate(): void {
    this.stopAutoRotate();
    this.startAutoRotate();
  }
}
