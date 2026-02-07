import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CarouselApiService } from './carousel-api.service';

describe('CarouselApiService', () => {
  let service: CarouselApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CarouselApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch active slides', () => {
    service.getActiveSlides().subscribe((slides) => {
      expect(slides.length).toBe(2);
      expect(slides[0].id).toBe('s1');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/slides'));
    expect(req.request.method).toBe('GET');
    req.flush([
      { id: 's1', imageUrl: 'img1.jpg', alt: 'Slide 1', order: 0, isActive: true },
      { id: 's2', imageUrl: 'img2.jpg', alt: 'Slide 2', order: 1, isActive: true },
    ]);
  });

  it('should create a slide', () => {
    service.createSlide({ imageUrl: 'new.jpg', alt: 'New', isActive: true }).subscribe((slide) => {
      expect(slide.id).toBe('s3');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/admin/slides'));
    expect(req.request.method).toBe('POST');
    req.flush({ id: 's3', imageUrl: 'new.jpg', alt: 'New', order: 2, isActive: true });
  });

  it('should update a slide', () => {
    service.updateSlide('s1', { alt: 'Updated' }).subscribe((slide) => {
      expect(slide.alt).toBe('Updated');
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/admin/slides/s1'));
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 's1', imageUrl: 'img1.jpg', alt: 'Updated', order: 0, isActive: true });
  });

  it('should delete a slide', () => {
    service.deleteSlide('s1').subscribe();

    const req = httpMock.expectOne((r) => r.url.includes('/api/admin/slides/s1'));
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });

  it('should reorder slides', () => {
    service.reorderSlides({ slideIds: ['s2', 's1'] }).subscribe((result) => {
      expect(result.length).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.includes('/api/admin/slides/reorder'));
    expect(req.request.method).toBe('PATCH');
    req.flush([
      { id: 's2', imageUrl: 'img2.jpg', alt: 'Slide 2', order: 0, isActive: true },
      { id: 's1', imageUrl: 'img1.jpg', alt: 'Slide 1', order: 1, isActive: true },
    ]);
  });
});
