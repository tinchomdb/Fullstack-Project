import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CarouselService } from '../../../core/services/carousel.service';
import { CarouselSlide } from '../../../core/models/carousel-slide.model';
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
export class AdminCarouselComponent implements OnInit {
  private readonly carouselService = inject(CarouselService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly slides = this.carouselService.allSlides;
  readonly loading = this.carouselService.allSlidesLoading;
  readonly error = this.carouselService.allSlidesError;

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
  readonly canMoveDown = (index: number) =>
    computed(() => {
      const currentSlides = this.slides() ?? [];
      return index < currentSlides.length - 1;
    });

  ngOnInit(): void {
    this.carouselService.loadActiveSlides();
  }

  /**
   * Generic error handler for all operations
   */
  private handleError(operation: string, error: unknown): void {
    console.error(`Failed to ${operation}:`, error);
    this.isFormSubmitting.set(false);
  }

  /**
   * Generic success handler for form operations
   */
  private handleFormSuccess(callback?: () => void): void {
    callback?.();
    this.isFormSubmitting.set(false);
  }

  addSlide(): void {
    if (this.newSlideForm.invalid) {
      this.newSlideForm.markAllAsTouched();
      return;
    }

    this.isFormSubmitting.set(true);
    const slide = this.newSlideForm.getRawValue();

    this.carouselService
      .createSlide(slide)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.handleFormSuccess(() => this.resetNewSlideForm()),
        error: (err) => this.handleError('create slide', err),
      });
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

    this.carouselService
      .updateSlide(slideId, form)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.handleFormSuccess(() => this.closeEditForm()),
        error: (err) => this.handleError('update slide', err),
      });
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
      this.carouselService
        .deleteSlide(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            // If we're editing the deleted slide, close the edit form
            if (this.editingSlideId() === id) {
              this.closeEditForm();
            }
          },
          error: (err) => this.handleError('delete slide', err),
        });
    }
  }

  toggleActive(id: string): void {
    const result = this.carouselService.toggleSlideActive(id);
    if (result) {
      result.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          // Slide toggled successfully
        },
        error: (err) => this.handleError('toggle slide', err),
      });
    }
  }

  moveUp(index: number): void {
    if (index === 0) {
      return;
    }

    this.reorderSlides(index, index - 1);
  }

  moveDown(index: number): void {
    const currentSlides = this.slides() ?? [];
    if (index >= currentSlides.length - 1) {
      return;
    }

    this.reorderSlides(index, index + 1);
  }

  private reorderSlides(fromIndex: number, toIndex: number): void {
    const currentSlides = this.slides() ?? [];
    if (currentSlides.length === 0) {
      return;
    }

    const slideIds = currentSlides.map((slide: CarouselSlide) => slide.id);
    [slideIds[fromIndex], slideIds[toIndex]] = [slideIds[toIndex], slideIds[fromIndex]];

    this.carouselService
      .reorderSlides(slideIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          // Slides reordered successfully
        },
        error: (err) => this.handleError('reorder slides', err),
      });
  }
}
