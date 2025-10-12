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
  private readonly transitionDuration = 500;

  protected readonly slides = computed(() => this.carouselService.activeSlides() ?? []);
  protected readonly loading = computed(() => this.carouselService.activeSlidesLoading());
  protected readonly error = computed(() => this.carouselService.activeSlidesError());

  protected readonly currentIndex = signal(0);
  protected readonly isTransitioning = signal(false);

  // Computed: Always keep 3 slides ready (left, current, right)
  protected readonly leftSlideIndex = computed(() => {
    const current = this.currentIndex();
    const total = this.slides().length;
    return total > 0 ? (current - 1 + total) % total : -1;
  });

  protected readonly rightSlideIndex = computed(() => {
    const current = this.currentIndex();
    const total = this.slides().length;
    return total > 0 ? (current + 1) % total : -1;
  });

  protected readonly hasSlides = computed(() => this.slides().length > 0);
  protected readonly canNavigate = computed(() => this.hasSlides() && !this.isTransitioning());

  ngOnInit(): void {
    this.carouselService.loadActiveSlides();
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
  }

  protected goToNext(): void {
    if (!this.canNavigate()) return;

    this.isTransitioning.set(true);

    // Simply increment the index - CSS handles the animation
    const total = this.slides().length;
    this.currentIndex.update((current) => (current + 1) % total);

    // Reset transition flag after animation completes
    setTimeout(() => {
      this.isTransitioning.set(false);
    }, this.transitionDuration);

    this.resetAutoRotate();
  }

  protected goToPrevious(): void {
    if (!this.canNavigate()) return;

    this.isTransitioning.set(true);

    // Simply decrement the index - CSS handles the animation
    const total = this.slides().length;
    this.currentIndex.update((current) => (current - 1 + total) % total);

    // Reset transition flag after animation completes
    setTimeout(() => {
      this.isTransitioning.set(false);
    }, this.transitionDuration);

    this.resetAutoRotate();
  }

  private startAutoRotate(): void {
    // Clear any existing interval first
    this.stopAutoRotate();

    this.autoRotateInterval = window.setInterval(() => {
      if (this.canNavigate()) {
        this.goToNext();
      }
    }, this.autoRotateDelay);
  }

  private stopAutoRotate(): void {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
      this.autoRotateInterval = undefined;
    }
  }

  private resetAutoRotate(): void {
    this.startAutoRotate();
  }
}
