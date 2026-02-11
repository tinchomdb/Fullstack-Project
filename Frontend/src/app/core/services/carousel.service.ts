import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { CarouselSlide } from '../models/carousel-slide.model';
import { CarouselApiService } from './carousel-api.service';
import {
  CreateCarouselSlideRequest,
  UpdateCarouselSlideRequest,
} from '../models/api/carousel-slide-api.model';
import { Resource } from '../../shared/utils/resource';
import { LoadingOverlayService } from './loading-overlay.service';

@Injectable({
  providedIn: 'root',
})
export class CarouselService {
  private readonly carouselApiService = inject(CarouselApiService);
  private readonly loadingOverlayService = inject(LoadingOverlayService);

  private readonly allSlidesResource = new Resource<readonly CarouselSlide[]>(
    [],
    'Loading carousel slides...',
    this.loadingOverlayService,
  );

  private readonly activeSlidesResource = new Resource<readonly CarouselSlide[]>(
    [],
    'Loading carousel slides...',
    this.loadingOverlayService,
  );

  // Public API - all slides (for admin use)
  readonly allSlides = this.allSlidesResource.data;
  readonly allSlidesLoading = this.allSlidesResource.loading;
  readonly allSlidesError = this.allSlidesResource.error;

  // Public API - active slides only (for guest/public use)
  readonly activeSlides = this.activeSlidesResource.data;
  readonly activeSlidesLoading = this.activeSlidesResource.loading;
  readonly activeSlidesError = this.activeSlidesResource.error;

  constructor() {
    this.loadActiveSlides();
  }

  private loadActiveSlides(): void {
    if (this.activeSlides() && this.activeSlides()!.length > 0) {
      return;
    }
    this.activeSlidesResource.load(this.carouselApiService.getActiveSlides());
  }

  reloadAllSlides(): void {
    this.allSlidesResource.load(this.carouselApiService.getActiveSlides());
  }

  reloadActiveSlides(): void {
    this.activeSlidesResource.load(this.carouselApiService.getActiveSlides());
  }

  createSlide(request: CreateCarouselSlideRequest): Observable<CarouselSlide> {
    return this.carouselApiService.createSlide(request).pipe(tap(() => this.reloadAllResources()));
  }

  updateSlide(id: string, updates: UpdateCarouselSlideRequest): Observable<CarouselSlide> {
    return this.carouselApiService
      .updateSlide(id, updates)
      .pipe(tap(() => this.reloadAllResources()));
  }

  deleteSlide(id: string): Observable<void> {
    return this.carouselApiService.deleteSlide(id).pipe(tap(() => this.reloadAllResources()));
  }

  reorderSlides(slideIds: string[]): Observable<CarouselSlide[]> {
    return this.carouselApiService
      .reorderSlides({ slideIds })
      .pipe(tap(() => this.reloadAllResources()));
  }

  toggleSlideActive(id: string): Observable<CarouselSlide> | null {
    const currentSlides = this.allSlides() ?? [];
    const currentSlide = currentSlides.find((slide: CarouselSlide) => slide.id === id);
    if (!currentSlide) return null;

    return this.updateSlide(id, { isActive: !currentSlide.isActive });
  }

  private reloadAllResources(): void {
    this.reloadAllSlides();
    this.reloadActiveSlides();
  }
}
