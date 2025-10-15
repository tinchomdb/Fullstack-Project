import { Directive, ElementRef, OnInit, OnDestroy, inject, output, input } from '@angular/core';

@Directive({
  selector: '[appIntersectionObserver]',
})
export class IntersectionObserverDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private observer?: IntersectionObserver;
  private debounceTimer?: ReturnType<typeof setTimeout>;
  private lastEmitTime = 0;

  /**
   * Threshold at which to trigger the intersection event (0-1)
   * Default: 0.1 (trigger when 10% of element is visible)
   */
  readonly threshold = input<number>(0.1);

  /**
   * Root margin for the intersection observer
   * Default: '200px' (trigger 200px before element enters viewport)
   */
  readonly rootMargin = input<string>('200px');

  /**
   * Debounce time in milliseconds to prevent rapid-fire events
   * Default: 300ms
   */
  readonly debounceMs = input<number>(300);

  /**
   * Event emitted when element intersects with viewport
   */
  readonly intersecting = output<void>();

  ngOnInit(): void {
    this.setupObserver();
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
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
          this.emitWithDebounce();
        }
      });
    }, options);

    this.observer.observe(this.elementRef.nativeElement);
  }

  private emitWithDebounce(): void {
    const now = Date.now();
    const timeSinceLastEmit = now - this.lastEmitTime;
    const debounceTime = this.debounceMs();

    if (timeSinceLastEmit < debounceTime) {
      // Too soon, schedule for later
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      this.debounceTimer = setTimeout(() => {
        this.lastEmitTime = Date.now();
        this.intersecting.emit();
      }, debounceTime - timeSinceLastEmit);
    } else {
      // Enough time passed, emit immediately
      this.lastEmitTime = now;
      this.intersecting.emit();
    }
  }
}
