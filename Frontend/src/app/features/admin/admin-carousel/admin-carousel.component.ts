import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarouselService } from '../../../core/services/carousel.service';
import { CarouselSlide } from '../../../shared/models/carousel-slide.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { FormCheckboxComponent } from '../../../shared/ui/form-checkbox/form-checkbox.component';

@Component({
  selector: 'app-admin-carousel',
  imports: [ReactiveFormsModule, ButtonComponent, FormFieldComponent, FormCheckboxComponent],
  templateUrl: './admin-carousel.component.html',
  styleUrl: './admin-carousel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCarouselComponent {
  private readonly carouselService = inject(CarouselService);
  private readonly fb = inject(FormBuilder);

  readonly slides = this.carouselService.allSlides;
  readonly isEditing = signal(false);
  readonly editingSlideId = signal<string | null>(null);

  readonly newSlideForm = this.fb.nonNullable.group({
    imageUrl: ['', [Validators.required]],
    alt: ['', [Validators.required, Validators.minLength(3)]],
    isActive: [true],
  });

  readonly editSlideForm = this.fb.nonNullable.group({
    imageUrl: ['', [Validators.required]],
    alt: ['', [Validators.required, Validators.minLength(3)]],
    isActive: [true],
  });

  readonly isFormSubmitting = signal(false);

  // Computed for template convenience
  readonly canMoveUp = (index: number) => computed(() => index > 0);
  readonly canMoveDown = (index: number) => computed(() => index < this.slides().length - 1);

  addSlide(): void {
    if (this.newSlideForm.invalid) {
      this.newSlideForm.markAllAsTouched();
      return;
    }

    this.isFormSubmitting.set(true);
    const slide = this.newSlideForm.getRawValue();
    this.carouselService.addSlide(slide);
    this.resetNewSlideForm();
    this.isFormSubmitting.set(false);
  }

  openEditForm(slide: CarouselSlide): void {
    this.isEditing.set(true);
    this.editingSlideId.set(slide.id);
    this.editSlideForm.patchValue({
      imageUrl: slide.imageUrl,
      alt: slide.alt,
      isActive: slide.isActive,
    });
  }

  closeEditForm(): void {
    this.isEditing.set(false);
    this.editingSlideId.set(null);
    this.editSlideForm.reset({ imageUrl: '', alt: '', isActive: true });
  }

  saveEdit(): void {
    const slideId = this.editingSlideId();
    if (!slideId || this.editSlideForm.invalid) {
      this.editSlideForm.markAllAsTouched();
      return;
    }

    this.isFormSubmitting.set(true);
    const form = this.editSlideForm.getRawValue();
    this.carouselService.updateSlide(slideId, form);
    this.closeEditForm();
    this.isFormSubmitting.set(false);
  }

  private resetNewSlideForm(): void {
    this.newSlideForm.reset({
      imageUrl: '',
      alt: '',
      isActive: true,
    });
  }

  deleteSlide(id: string): void {
    const confirmDelete = confirm(
      'Are you sure you want to delete this slide? This action cannot be undone.',
    );

    if (confirmDelete) {
      this.carouselService.deleteSlide(id);

      // If we're editing the deleted slide, close the edit form
      if (this.editingSlideId() === id) {
        this.closeEditForm();
      }
    }
  }

  toggleActive(id: string): void {
    this.carouselService.toggleSlideActive(id);
  }

  moveUp(index: number): void {
    if (index === 0) {
      return;
    }

    this.reorderSlides(index, index - 1);
  }

  moveDown(index: number): void {
    const currentSlides = this.slides();
    if (index >= currentSlides.length - 1) {
      return;
    }

    this.reorderSlides(index, index + 1);
  }

  private reorderSlides(fromIndex: number, toIndex: number): void {
    const currentSlides = this.slides();
    const slideIds = currentSlides.map((s) => s.id);
    [slideIds[fromIndex], slideIds[toIndex]] = [slideIds[toIndex], slideIds[fromIndex]];
    this.carouselService.reorderSlides(slideIds);
  }
}
