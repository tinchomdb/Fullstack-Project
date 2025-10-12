import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  effect,
  inject,
} from '@angular/core';

import { NavigationArrowComponent } from '../navigation-arrow/navigation-arrow.component';
import { CarouselService } from '../../../core/services/carousel.service';
import { CarouselSlide } from '../../../shared/models/carousel-slide.model';

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
  private previousSlideCount = -1;

  protected readonly slides = computed(() => this.carouselService.activeSlides() ?? []);
  protected readonly loading = computed(() => this.carouselService.activeSlidesLoading());
  protected readonly error = computed(() => this.carouselService.activeSlidesError());

  private readonly currentPosition = signal(0);
  private readonly isTransitioning = signal(false);
  private readonly disableTransition = signal(false);

  protected readonly renderedSlides = computed(() => {
    const slides = this.slides();
    if (slides.length === 0) {
      return [] as readonly CarouselSlide[];
    }

    if (slides.length === 1) {
      return slides;
    }

    const first = slides[0];
    const last = slides[slides.length - 1];
    return [last, ...slides, first] as readonly CarouselSlide[];
  });

  protected readonly trackTransform = computed(
    () => `translateX(-${this.currentPosition() * 100}%)`,
  );

  protected readonly hasSlides = computed(() => this.slides().length > 0);
  protected readonly canNavigate = computed(
    () => this.slides().length > 1 && !this.isTransitioning(),
  );

  protected readonly trackShouldDisableTransition = computed(() => this.disableTransition());

  constructor() {
    effect(() => {
      const slides = this.slides();
      const count = slides.length;

      if (count === this.previousSlideCount) {
        if (count <= 1) {
          this.stopAutoRotate();
        } else {
          this.startAutoRotate();
        }
        return;
      }

      this.previousSlideCount = count;

      if (count === 0) {
        this.stopAutoRotate();
        this.setTrackPosition(0, true);
        return;
      }

      if (count === 1) {
        this.stopAutoRotate();
        this.setTrackPosition(0, true);
        return;
      }

      this.startAutoRotate();
      this.setTrackPosition(1, true);
    });
  }

  ngOnInit(): void {
    this.carouselService.loadActiveSlides();
    this.startAutoRotate();
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
  }

  protected goToNext(): void {
    if (!this.canNavigate()) {
      return;
    }

    this.isTransitioning.set(true);
    this.currentPosition.update((position) => position + 1);
    this.resetAutoRotate();
  }

  protected goToPrevious(): void {
    if (!this.canNavigate()) {
      return;
    }

    this.isTransitioning.set(true);
    this.currentPosition.update((position) => position - 1);
    this.resetAutoRotate();
  }

  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName !== 'transform' || !this.isTransitioning()) {
      return;
    }

    const slides = this.renderedSlides();
    if (slides.length <= 1) {
      this.isTransitioning.set(false);
      return;
    }

    const lastIndex = slides.length - 1;
    const current = this.currentPosition();

    if (current === lastIndex) {
      this.setTrackPosition(1, true);
      return;
    } else if (current === 0) {
      this.setTrackPosition(lastIndex - 1, true);
      return;
    }

    this.isTransitioning.set(false);
  }

  private startAutoRotate(): void {
    this.stopAutoRotate();

    if (this.slides().length <= 1) {
      return;
    }

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

  private setTrackPosition(position: number, withoutTransition = false): void {
    if (withoutTransition) {
      this.isTransitioning.set(true);
      this.disableTransition.set(true);
      this.currentPosition.set(position);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.disableTransition.set(false);
          this.isTransitioning.set(false);
        });
      });
      return;
    }

    this.currentPosition.set(position);
  }

  protected trackSlideId(slide: CarouselSlide, index: number): string {
    return `${slide.id}-${index}`;
  }
}
