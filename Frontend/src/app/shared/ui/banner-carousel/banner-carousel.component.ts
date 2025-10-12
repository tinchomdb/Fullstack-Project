import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
} from '@angular/core';

import { NavigationArrowComponent } from '../navigation-arrow/navigation-arrow.component';

interface CarouselSlide {
  imageUrl: string;
  alt: string;
}

@Component({
  selector: 'app-banner-carousel',
  imports: [NavigationArrowComponent],
  templateUrl: './banner-carousel.component.html',
  styleUrl: './banner-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCarouselComponent implements OnInit, OnDestroy {
  private autoRotateInterval?: number;
  private readonly autoRotateDelay = 5000;

  protected readonly slides: CarouselSlide[] = [
    {
      imageUrl:
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop',
      alt: 'Shop the latest fashion trends',
    },
    {
      imageUrl:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&h=600&fit=crop',
      alt: 'Discover premium watches and accessories',
    },
    {
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=600&fit=crop',
      alt: 'Tech essentials for modern living',
    },
    {
      imageUrl:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=600&fit=crop',
      alt: 'Home decor and lifestyle products',
    },
  ];

  protected readonly currentIndex = signal(0);
  protected readonly previousIndex = signal<number | null>(null);
  protected readonly isTransitioning = signal(false);

  protected readonly currentSlide = computed(() => this.slides[this.currentIndex()]);

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
    this.currentIndex.update((index) => (index + 1) % this.slides.length);

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
    this.currentIndex.update((index) => (index - 1 + this.slides.length) % this.slides.length);

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
