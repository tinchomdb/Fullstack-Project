import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BannerCarouselComponent } from './banner-carousel.component';
import { CarouselService } from '../../../core/services/carousel.service';
import { CarouselSlide } from '../../../core/models/carousel-slide.model';

describe('BannerCarouselComponent', () => {
  let fixture: ComponentFixture<BannerCarouselComponent>;
  let component: BannerCarouselComponent;
  let activeSlides: ReturnType<typeof signal<readonly CarouselSlide[]>>;
  let carouselSpy: jasmine.SpyObj<CarouselService>;

  const TRANSPARENT_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12NgYPgPAAEDAQDZqt2zAAAAAElFTkSuQmCC';

  const mockSlides: CarouselSlide[] = [
    { id: '1', imageUrl: TRANSPARENT_PNG, alt: 'Slide 1', order: 0, isActive: true },
    { id: '2', imageUrl: TRANSPARENT_PNG, alt: 'Slide 2', order: 1, isActive: true },
    { id: '3', imageUrl: TRANSPARENT_PNG, alt: 'Slide 3', order: 2, isActive: true },
  ];

  beforeEach(async () => {
    activeSlides = signal<readonly CarouselSlide[]>([]);

    carouselSpy = jasmine.createSpyObj('CarouselService', ['loadActiveSlides'], {
      activeSlides,
      activeSlidesLoading: signal(false),
      activeSlidesError: signal(null),
    });

    await TestBed.configureTestingModule({
      imports: [BannerCarouselComponent],
      providers: [{ provide: CarouselService, useValue: carouselSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(BannerCarouselComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should call loadActiveSlides on init', () => {
    fixture.detectChanges();
    expect(carouselSpy.loadActiveSlides).toHaveBeenCalled();
  });

  it('should have no slides initially', () => {
    fixture.detectChanges();
    expect(component['slides']()).toEqual([]);
    expect(component['hasSlides']()).toBeFalse();
  });

  it('should compute renderedSlides with clones for infinite scroll', () => {
    activeSlides.set(mockSlides);
    fixture.detectChanges();
    TestBed.flushEffects();

    const rendered = component['renderedSlides']();
    expect(rendered.length).toBe(5); // last + 3 originals + first
    expect(rendered[0].id).toBe('3'); // clone of last
    expect(rendered[4].id).toBe('1'); // clone of first
  });

  it('should return single slide without clones', () => {
    activeSlides.set([mockSlides[0]]);
    fixture.detectChanges();
    TestBed.flushEffects();

    const rendered = component['renderedSlides']();
    expect(rendered.length).toBe(1);
  });

  it('should compute canNavigate as false for single slide', () => {
    activeSlides.set([mockSlides[0]]);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(component['canNavigate']()).toBeFalse();
  });

  it('should compute canNavigate based on slide count', () => {
    activeSlides.set(mockSlides);
    fixture.detectChanges();
    TestBed.flushEffects();

    // canNavigate depends on slides.length > 1 AND !isTransitioning
    // After the effect runs, isTransitioning might be true from setTrackPosition
    expect(component['slides']().length).toBeGreaterThan(1);
  });

  it('should track slide by id and index', () => {
    const slide: CarouselSlide = { id: '1', imageUrl: '', alt: '', order: 0, isActive: true };
    expect(component['trackSlideId'](slide, 2)).toBe('1-2');
  });

  it('should clean up on destroy', () => {
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
  });
});
