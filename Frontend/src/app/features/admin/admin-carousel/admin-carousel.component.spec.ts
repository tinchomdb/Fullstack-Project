import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { AdminCarouselComponent } from './admin-carousel.component';
import { CarouselService } from '../../../core/services/carousel.service';
import { CarouselSlide } from '../../../core/models/carousel-slide.model';

describe('AdminCarouselComponent', () => {
  let component: AdminCarouselComponent;
  let fixture: ComponentFixture<AdminCarouselComponent>;
  let carouselService: jasmine.SpyObj<CarouselService>;

  const mockSlides: CarouselSlide[] = [
    { id: 's1', imageUrl: 'img1.jpg', alt: 'Slide 1', order: 0, isActive: true },
    { id: 's2', imageUrl: 'img2.jpg', alt: 'Slide 2', order: 1, isActive: false },
    { id: 's3', imageUrl: 'img3.jpg', alt: 'Slide 3', order: 2, isActive: true },
  ];

  beforeEach(() => {
    carouselService = jasmine.createSpyObj(
      'CarouselService',
      ['createSlide', 'updateSlide', 'deleteSlide', 'reorderSlides', 'toggleSlideActive'],
      {
        allSlides: signal<CarouselSlide[]>(mockSlides),
        allSlidesLoading: signal(false),
        allSlidesError: signal<string | null>(null),
      },
    );

    carouselService.createSlide.and.returnValue(of(mockSlides[0]));
    carouselService.updateSlide.and.returnValue(of(mockSlides[0]));
    carouselService.deleteSlide.and.returnValue(of(undefined));
    carouselService.reorderSlides.and.returnValue(of(mockSlides));
    carouselService.toggleSlideActive.and.returnValue(of(mockSlides[0]));

    TestBed.configureTestingModule({
      imports: [AdminCarouselComponent, ReactiveFormsModule],
      providers: [{ provide: CarouselService, useValue: carouselService }],
    }).overrideComponent(AdminCarouselComponent, {
      set: { template: '' },
    });

    fixture = TestBed.createComponent(AdminCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('addSlide', () => {
    it('should not submit when form is invalid', () => {
      component.addSlide();
      expect(carouselService.createSlide).not.toHaveBeenCalled();
    });

    it('should submit valid form', () => {
      component.newSlideForm.patchValue({ imageUrl: 'new.jpg', alt: 'New Slide' });
      component.addSlide();
      expect(carouselService.createSlide).toHaveBeenCalled();
      expect(component.isFormSubmitting()).toBe(false);
    });

    it('should set isFormSubmitting during submission', () => {
      component.newSlideForm.patchValue({ imageUrl: 'new.jpg', alt: 'New Slide' });
      component.addSlide();
      // After success callback, isFormSubmitting should be false
      expect(component.isFormSubmitting()).toBe(false);
    });

    it('should handle create error', () => {
      spyOn(console, 'error');
      carouselService.createSlide.and.returnValue(throwError(() => new Error('fail')));
      component.newSlideForm.patchValue({ imageUrl: 'new.jpg', alt: 'New Slide' });
      component.addSlide();
      expect(console.error).toHaveBeenCalled();
      expect(component.isFormSubmitting()).toBe(false);
    });

    it('should reset form after successful add', () => {
      component.newSlideForm.patchValue({ imageUrl: 'new.jpg', alt: 'New Slide' });
      component.addSlide();
      expect(component.newSlideForm.value.imageUrl).toBe('');
    });
  });

  describe('edit form', () => {
    it('should open edit form with slide data', () => {
      component.openEditForm(mockSlides[0]);
      expect(component.isEditing()).toBe(true);
      expect(component.editingSlideId()).toBe('s1');
      expect(component.editSlideForm.value.imageUrl).toBe('img1.jpg');
      expect(component.editSlideForm.value.alt).toBe('Slide 1');
    });

    it('should close edit form and reset state', () => {
      component.openEditForm(mockSlides[0]);
      component.closeEditForm();
      expect(component.isEditing()).toBe(false);
      expect(component.editingSlideId()).toBeNull();
    });

    it('should save edit with valid form', () => {
      component.openEditForm(mockSlides[0]);
      component.editSlideForm.patchValue({ imageUrl: 'updated.jpg', alt: 'Updated' });
      component.saveEdit();
      expect(carouselService.updateSlide).toHaveBeenCalledWith('s1', jasmine.any(Object));
    });

    it('should not save edit without slide id', () => {
      component.saveEdit();
      expect(carouselService.updateSlide).not.toHaveBeenCalled();
    });

    it('should close edit form after successful save', () => {
      component.openEditForm(mockSlides[0]);
      component.saveEdit();
      expect(component.isEditing()).toBe(false);
    });

    it('should handle save edit error', () => {
      spyOn(console, 'error');
      carouselService.updateSlide.and.returnValue(throwError(() => new Error('fail')));
      component.openEditForm(mockSlides[0]);
      component.saveEdit();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteSlide', () => {
    it('should delete slide after confirmation', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.deleteSlide('s1');
      expect(carouselService.deleteSlide).toHaveBeenCalledWith('s1');
    });

    it('should not delete when user cancels', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.deleteSlide('s1');
      expect(carouselService.deleteSlide).not.toHaveBeenCalled();
    });

    it('should close edit form if deleting the edited slide', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      component.openEditForm(mockSlides[0]);
      component.deleteSlide('s1');
      expect(component.isEditing()).toBe(false);
    });
  });

  describe('toggleActive', () => {
    it('should toggle slide active status', () => {
      component.toggleActive('s1');
      expect(carouselService.toggleSlideActive).toHaveBeenCalledWith('s1');
    });

    it('should handle null result from toggleSlideActive', () => {
      carouselService.toggleSlideActive.and.returnValue(null);
      expect(() => component.toggleActive('nonexistent')).not.toThrow();
    });
  });

  describe('reorder', () => {
    it('should not move up at index 0', () => {
      component.moveUp(0);
      expect(carouselService.reorderSlides).not.toHaveBeenCalled();
    });

    it('should move up from index 1', () => {
      component.moveUp(1);
      expect(carouselService.reorderSlides).toHaveBeenCalledWith(['s2', 's1', 's3']);
    });

    it('should not move down at last index', () => {
      component.moveDown(2);
      expect(carouselService.reorderSlides).not.toHaveBeenCalled();
    });

    it('should move down from index 0', () => {
      component.moveDown(0);
      expect(carouselService.reorderSlides).toHaveBeenCalledWith(['s2', 's1', 's3']);
    });
  });

  it('should clean up on destroy without errors', () => {
    expect(() => fixture.destroy()).not.toThrow();
  });
});
