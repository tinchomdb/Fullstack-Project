import { mapCarouselSlideFromApi, mapCarouselSlideToApi } from './carousel-slide.mapper';
import { CarouselSlideApiModel } from '../models/api/carousel-slide-api.model';
import { CarouselSlide } from '../models/carousel-slide.model';

describe('carousel-slide.mapper', () => {
  describe('mapCarouselSlideFromApi', () => {
    it('should map a fully populated slide', () => {
      const dto: CarouselSlideApiModel = {
        id: 'slide-1',
        imageUrl: 'https://img.com/banner.jpg',
        alt: 'Banner image',
        order: 2,
        isActive: true,
      };

      const result = mapCarouselSlideFromApi(dto);

      expect(result.id).toBe('slide-1');
      expect(result.imageUrl).toBe('https://img.com/banner.jpg');
      expect(result.alt).toBe('Banner image');
      expect(result.order).toBe(2);
      expect(result.isActive).toBe(true);
    });

    it('should apply defaults for missing fields', () => {
      const dto: CarouselSlideApiModel = {};

      const result = mapCarouselSlideFromApi(dto);

      expect(result.id).toBe('');
      expect(result.imageUrl).toBe('');
      expect(result.alt).toBe('');
      expect(result.order).toBe(0);
      expect(result.isActive).toBe(true);
    });

    it('should default isActive to true when undefined', () => {
      const dto: CarouselSlideApiModel = { isActive: undefined };
      expect(mapCarouselSlideFromApi(dto).isActive).toBe(true);
    });

    it('should preserve isActive false', () => {
      const dto: CarouselSlideApiModel = { isActive: false };
      expect(mapCarouselSlideFromApi(dto).isActive).toBe(false);
    });
  });

  describe('mapCarouselSlideToApi', () => {
    it('should reverse-map a slide to API model', () => {
      const slide: CarouselSlide = {
        id: 'slide-1',
        imageUrl: 'banner.jpg',
        alt: 'Alt text',
        order: 3,
        isActive: false,
      };

      const result = mapCarouselSlideToApi(slide);

      expect(result.id).toBe('slide-1');
      expect(result.imageUrl).toBe('banner.jpg');
      expect(result.alt).toBe('Alt text');
      expect(result.order).toBe(3);
      expect(result.isActive).toBe(false);
    });
  });
});
