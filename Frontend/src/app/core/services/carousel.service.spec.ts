import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CarouselService } from './carousel.service';
import { CarouselApiService } from './carousel-api.service';
import { LoadingOverlayService } from './loading-overlay.service';
import {
  CreateCarouselSlideRequest,
  UpdateCarouselSlideRequest,
} from '../models/api/carousel-slide-api.model';
import { CarouselSlide } from '../models/carousel-slide.model';

describe('CarouselService', () => {
  let service: CarouselService;
  let apiSpy: jasmine.SpyObj<CarouselApiService>;

  const mockSlides: CarouselSlide[] = [
    {
      id: '1',
      imageUrl: 'img1.jpg',
      alt: 'Slide 1',
      isActive: true,
      order: 0,
    },
    {
      id: '2',
      imageUrl: 'img2.jpg',
      alt: 'Slide 2',
      isActive: false,
      order: 1,
    },
  ];

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('CarouselApiService', [
      'getActiveSlides',
      'createSlide',
      'updateSlide',
      'deleteSlide',
      'reorderSlides',
    ]);
    apiSpy.getActiveSlides.and.returnValue(of(mockSlides));

    TestBed.configureTestingModule({
      providers: [
        CarouselService,
        { provide: CarouselApiService, useValue: apiSpy },
        {
          provide: LoadingOverlayService,
          useValue: { show: jasmine.createSpy(), hide: jasmine.createSpy() },
        },
      ],
    });

    service = TestBed.inject(CarouselService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have empty initial state', () => {
    expect(service.allSlides()).toEqual([]);
    expect(service.activeSlides()).toEqual([]);
  });

  it('should load active slides only once if already loaded', () => {
    service.loadActiveSlides();
    service.loadActiveSlides();
    expect(apiSpy.getActiveSlides).toHaveBeenCalledTimes(1);
  });

  it('should reload all slides', () => {
    service.reloadAllSlides();
    expect(apiSpy.getActiveSlides).toHaveBeenCalled();
  });

  it('should reload active slides', () => {
    service.reloadActiveSlides();
    expect(apiSpy.getActiveSlides).toHaveBeenCalled();
  });

  it('should create slide and reload resources', () => {
    const request = { imageUrl: 'new.jpg', alt: 'New Slide', isActive: true };
    const created: CarouselSlide = {
      id: '3',
      imageUrl: 'new.jpg',
      alt: 'New Slide',
      isActive: true,
      order: 2,
    };
    apiSpy.createSlide.and.returnValue(of(created));

    service.createSlide(request).subscribe((result) => {
      expect(result).toEqual(created);
    });
    expect(apiSpy.createSlide).toHaveBeenCalledWith(request);
  });

  it('should update slide and reload resources', () => {
    const updates: UpdateCarouselSlideRequest = { alt: 'Updated' };
    const updated: CarouselSlide = { ...mockSlides[0], alt: 'Updated' };
    apiSpy.updateSlide.and.returnValue(of(updated));

    service.updateSlide('1', updates).subscribe((result) => {
      expect(result).toEqual(updated);
    });
    expect(apiSpy.updateSlide).toHaveBeenCalledWith('1', updates);
  });

  it('should delete slide and reload resources', () => {
    apiSpy.deleteSlide.and.returnValue(of(void 0));

    service.deleteSlide('1').subscribe();
    expect(apiSpy.deleteSlide).toHaveBeenCalledWith('1');
  });

  it('should reorder slides and reload resources', () => {
    apiSpy.reorderSlides.and.returnValue(of(mockSlides));

    service.reorderSlides(['2', '1']).subscribe();
    expect(apiSpy.reorderSlides).toHaveBeenCalledWith({ slideIds: ['2', '1'] });
  });

  it('should toggle slide active status', () => {
    service.reloadAllSlides();

    const toggled = { ...mockSlides[0], isActive: false };
    apiSpy.updateSlide.and.returnValue(of(toggled));

    const result = service.toggleSlideActive('1');
    expect(result).toBeTruthy();
    result?.subscribe();
    expect(apiSpy.updateSlide).toHaveBeenCalledWith('1', { isActive: false });
  });

  it('should return null when toggling non-existent slide', () => {
    const result = service.toggleSlideActive('nonexistent');
    expect(result).toBeNull();
  });
});
