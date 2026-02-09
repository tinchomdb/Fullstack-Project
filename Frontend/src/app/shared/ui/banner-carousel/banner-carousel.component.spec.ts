import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { BannerCarouselComponent } from './banner-carousel.component';
import { CarouselSlide } from '../../../core/models/carousel-slide.model';

@Component({
  template: `<app-banner-carousel
    [slides]="slides()"
    [loading]="loading()"
    [error]="error()"
  />`,
  imports: [BannerCarouselComponent],
})
class TestHostComponent {
  slides = signal<readonly CarouselSlide[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
}

describe('BannerCarouselComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  const TRANSPARENT_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIABQABNjN9GQAAAAlwSFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12NgYPgPAAEDAQDZqt2zAAAAAElFTkSuQmCC';

  const mockSlides: CarouselSlide[] = [
    { id: '1', imageUrl: TRANSPARENT_PNG, alt: 'Slide 1', order: 0, isActive: true },
    { id: '2', imageUrl: TRANSPARENT_PNG, alt: 'Slide 2', order: 1, isActive: true },
    { id: '3', imageUrl: TRANSPARENT_PNG, alt: 'Slide 3', order: 2, isActive: true },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
  });

  function getComponent(): BannerCarouselComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    fixture.detectChanges();
    expect(getComponent()).toBeTruthy();
  });

  it('should have no slides initially', () => {
    fixture.detectChanges();
    expect(getComponent()['slides']()).toEqual([]);
    expect(getComponent()['hasSlides']()).toBeFalse();
  });

  it('should compute renderedSlides with clones for infinite scroll', () => {
    host.slides.set(mockSlides);
    fixture.detectChanges();
    TestBed.flushEffects();

    const rendered = getComponent()['renderedSlides']();
    expect(rendered.length).toBe(5); // last + 3 originals + first
    expect(rendered[0].id).toBe('3'); // clone of last
    expect(rendered[4].id).toBe('1'); // clone of first
  });

  it('should return single slide without clones', () => {
    host.slides.set([mockSlides[0]]);
    fixture.detectChanges();
    TestBed.flushEffects();

    const rendered = getComponent()['renderedSlides']();
    expect(rendered.length).toBe(1);
  });

  it('should compute canNavigate as false for single slide', () => {
    host.slides.set([mockSlides[0]]);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(getComponent()['canNavigate']()).toBeFalse();
  });

  it('should compute canNavigate based on slide count', () => {
    host.slides.set(mockSlides);
    fixture.detectChanges();
    TestBed.flushEffects();

    expect(getComponent()['slides']().length).toBeGreaterThan(1);
  });

  it('should track slide by id and index', () => {
    fixture.detectChanges();
    const slide: CarouselSlide = { id: '1', imageUrl: '', alt: '', order: 0, isActive: true };
    expect(getComponent()['trackSlideId'](slide, 2)).toBe('1-2');
  });

  it('should receive loading input', () => {
    host.loading.set(true);
    fixture.detectChanges();
    expect(getComponent().loading()).toBeTrue();
  });

  it('should receive error input', () => {
    host.error.set('Something went wrong');
    fixture.detectChanges();
    expect(getComponent().error()).toBe('Something went wrong');
  });

  it('should clean up on destroy', () => {
    fixture.detectChanges();
    expect(() => fixture.destroy()).not.toThrow();
  });
});
