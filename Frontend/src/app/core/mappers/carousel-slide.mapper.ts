import { CarouselSlide } from '../models/carousel-slide.model';
import { CarouselSlideApiModel } from '../models/api/carousel-slide-api.model';
import { ensureString, ensureNumber } from '../../shared/utils/normalization.utils';

function ensureBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
}

export function mapCarouselSlideFromApi(dto: CarouselSlideApiModel): CarouselSlide {
  return {
    id: ensureString(dto.id),
    imageUrl: ensureString(dto.imageUrl),
    alt: ensureString(dto.alt),
    order: ensureNumber(dto.order),
    isActive: ensureBoolean(dto.isActive, true),
  };
}

export function mapCarouselSlideToApi(slide: CarouselSlide): CarouselSlideApiModel {
  return {
    id: slide.id,
    imageUrl: slide.imageUrl,
    alt: slide.alt,
    order: slide.order,
    isActive: slide.isActive,
  };
}
