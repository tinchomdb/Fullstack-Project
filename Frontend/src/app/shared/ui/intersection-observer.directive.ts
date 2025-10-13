import { Directive, ElementRef, OnInit, OnDestroy, inject, output, input } from '@angular/core';

@Directive({
  selector: '[appIntersectionObserver]',
})
export class IntersectionObserverDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private observer?: IntersectionObserver;

  /**
   * Threshold at which to trigger the intersection event (0-1)
   * Default: 0.1 (trigger when 10% of element is visible)
   */
  readonly threshold = input<number>(0.1);

  /**
   * Root margin for the intersection observer
   * Default: '100px' (trigger 100px before element enters viewport)
   */
  readonly rootMargin = input<string>('100px');

  /**
   * Event emitted when element intersects with viewport
   */
  readonly intersecting = output<void>();

  ngOnInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private setupObserver(): void {
    const options: IntersectionObserverInit = {
      root: null, // viewport
      rootMargin: this.rootMargin(),
      threshold: this.threshold(),
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.intersecting.emit();
        }
      });
    }, options);

    this.observer.observe(this.elementRef.nativeElement);
  }
}
