import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { CarouselSlide } from '../models/carousel-slide.model';
import {
  CarouselSlideApiModel,
  CreateCarouselSlideRequest,
  UpdateCarouselSlideRequest,
  ReorderCarouselSlidesRequest,
} from '../models/api/carousel-slide-api.model';
import { mapCarouselSlideFromApi } from '../mappers/carousel-slide.mapper';

@Injectable({ providedIn: 'root' })
export class CarouselApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBase}/api/admin/slides`;
  private readonly publicUrl = `${environment.apiBase}/api/slides`;

  getSlides(): Observable<CarouselSlide[]> {
    return this.http
      .get<CarouselSlideApiModel[]>(this.baseUrl)
      .pipe(map((response) => response.map(mapCarouselSlideFromApi)));
  }

  getActiveSlides(): Observable<CarouselSlide[]> {
    return this.http
      .get<CarouselSlideApiModel[]>(`${this.publicUrl}/active`)
      .pipe(map((response) => response.map(mapCarouselSlideFromApi)));
  }

  createSlide(request: CreateCarouselSlideRequest): Observable<CarouselSlide> {
    return this.http
      .post<CarouselSlideApiModel>(`${this.baseUrl}`, request)
      .pipe(map(mapCarouselSlideFromApi));
  }

  updateSlide(id: string, request: UpdateCarouselSlideRequest): Observable<CarouselSlide> {
    return this.http
      .put<CarouselSlideApiModel>(`${this.baseUrl}/${id}`, request)
      .pipe(map(mapCarouselSlideFromApi));
  }

  deleteSlide(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  reorderSlides(request: ReorderCarouselSlidesRequest): Observable<CarouselSlide[]> {
    return this.http
      .patch<CarouselSlideApiModel[]>(`${this.baseUrl}/reorder`, request)
      .pipe(map((response) => response.map(mapCarouselSlideFromApi)));
  }
}
