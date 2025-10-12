import { Injectable, signal, computed } from '@angular/core';
import { CarouselSlide } from '../../shared/models/carousel-slide.model';

@Injectable({
  providedIn: 'root',
})
export class CarouselService {
  private readonly slides = signal<CarouselSlide[]>([
    {
      id: '1',
      imageUrl:
        'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop',
      alt: 'Shop the latest fashion trends',
      order: 1,
      isActive: true,
    },
    {
      id: '2',
      imageUrl:
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&h=600&fit=crop',
      alt: 'Discover premium watches and accessories',
      order: 2,
      isActive: true,
    },
    {
      id: '3',
      imageUrl:
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&h=600&fit=crop',
      alt: 'Tech essentials for modern living',
      order: 3,
      isActive: true,
    },
    {
      id: '4',
      imageUrl:
        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=600&fit=crop',
      alt: 'Home decor and lifestyle products',
      order: 4,
      isActive: true,
    },
  ]);

  readonly allSlides = this.slides.asReadonly();

  readonly activeSlides = computed(() =>
    this.slides()
      .filter((slide) => slide.isActive)
      .sort((a, b) => a.order - b.order),
  );

  addSlide(slide: Omit<CarouselSlide, 'id' | 'order'>): void {
    const newSlide: CarouselSlide = {
      ...slide,
      id: crypto.randomUUID(),
      order: this.slides().length + 1,
    };

    this.slides.update((slides) => [...slides, newSlide]);
  }

  updateSlide(id: string, updates: Partial<Omit<CarouselSlide, 'id'>>): void {
    this.slides.update((slides) =>
      slides.map((slide) => (slide.id === id ? { ...slide, ...updates } : slide)),
    );
  }

  deleteSlide(id: string): void {
    this.slides.update((slides) => {
      const filtered = slides.filter((slide) => slide.id !== id);
      // Reorder remaining slides
      return filtered.map((slide, index) => ({
        ...slide,
        order: index + 1,
      }));
    });
  }

  reorderSlides(slideIds: string[]): void {
    this.slides.update((slides) => {
      const slideMap = new Map(slides.map((slide) => [slide.id, slide]));
      return slideIds
        .map((id, index) => {
          const slide = slideMap.get(id);
          return slide ? { ...slide, order: index + 1 } : null;
        })
        .filter((slide): slide is CarouselSlide => slide !== null);
    });
  }

  toggleSlideActive(id: string): void {
    this.slides.update((slides) =>
      slides.map((slide) => (slide.id === id ? { ...slide, isActive: !slide.isActive } : slide)),
    );
  }
}
