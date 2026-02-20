import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  input,
  signal,
  computed,
  effect,
} from '@angular/core';

import { NavigationArrowComponent } from '../navigation-arrow/navigation-arrow.component';
import { CarouselSlide } from '../../../core/models/carousel-slide.model';

@Component({
  selector: 'app-banner-carousel',
  imports: [NavigationArrowComponent],
  templateUrl: './banner-carousel.component.html',
  styleUrl: './banner-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BannerCarouselComponent implements OnDestroy {
  readonly slides = input<readonly CarouselSlide[]>([]);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  private autoRotateInterval?: number;
  private readonly autoRotateDelay = 5000;
  private previousSlideCount = -1;

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

  protected readonly activeSlideIndex = computed(() => {
    const slides = this.slides();
    if (slides.length <= 1) return 0;
    const pos = this.currentPosition();
    // Position 0 is the cloned last slide, 1..N are real slides, N+1 is cloned first
    const index = pos - 1;
    if (index < 0) return slides.length - 1;
    if (index >= slides.length) return 0;
    return index;
  });

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

  protected goToSlide(index: number): void {
    if (!this.canNavigate()) {
      return;
    }

    // Position in renderedSlides is index + 1 (because of the cloned last slide at position 0)
    const targetPosition = index + 1;
    if (targetPosition === this.currentPosition()) {
      return;
    }

    this.isTransitioning.set(true);
    this.currentPosition.set(targetPosition);
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
