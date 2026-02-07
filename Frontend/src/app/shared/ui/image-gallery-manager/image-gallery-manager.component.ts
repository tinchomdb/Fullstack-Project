import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  effect,
} from '@angular/core';

@Component({
  selector: 'app-image-gallery-manager',
  imports: [],
  templateUrl: './image-gallery-manager.component.html',
  styleUrl: './image-gallery-manager.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGalleryManagerComponent {
  readonly images = input<readonly string[]>([]);
  readonly imagesChange = output<string[]>();

  readonly newImageUrl = signal<string>('');
  readonly imageList = signal<string[]>([]);
  readonly selectedImageIndex = signal<number | null>(null);

  readonly canAddImage = computed(() => this.newImageUrl().trim().length > 0);
  readonly hasImages = computed(() => this.imageList().length > 0);
  readonly selectedImage = computed(() => {
    const index = this.selectedImageIndex();
    if (index === null) return null;
    return this.imageList()[index] ?? null;
  });

  constructor() {
    effect(() => {
      this.imageList.set([...this.images()]);
    });
  }

  addImage(): void {
    const url = this.newImageUrl().trim();
    if (!url) return;

    this.imageList.update((images) => [...images, url]);
    this.newImageUrl.set('');
    this.emitChanges();
  }

  removeImage(index: number): void {
    this.imageList.update((images) => images.filter((_, i) => i !== index));

    const selectedIdx = this.selectedImageIndex();
    if (selectedIdx === index) {
      this.selectedImageIndex.set(null);
    } else if (selectedIdx !== null && selectedIdx > index) {
      this.selectedImageIndex.update((idx) => (idx !== null ? idx - 1 : null));
    }

    this.emitChanges();
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(this.selectedImageIndex() === index ? null : index);
  }

  moveUp(index: number): void {
    if (index === 0) return;

    this.imageList.update((images) => {
      const newImages = [...images];
      [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      return newImages;
    });

    const selectedIdx = this.selectedImageIndex();
    if (selectedIdx === index) {
      this.selectedImageIndex.set(index - 1);
    } else if (selectedIdx === index - 1) {
      this.selectedImageIndex.set(index);
    }

    this.emitChanges();
  }

  moveDown(index: number): void {
    const images = this.imageList();
    if (index >= images.length - 1) return;

    this.imageList.update((imgs) => {
      const newImages = [...imgs];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages;
    });

    const selectedIdx = this.selectedImageIndex();
    if (selectedIdx === index) {
      this.selectedImageIndex.set(index + 1);
    } else if (selectedIdx === index + 1) {
      this.selectedImageIndex.set(index);
    }

    this.emitChanges();
  }

  clearAllImages(): void {
    if (!confirm('Are you sure you want to remove all images?')) {
      return;
    }
    this.imageList.set([]);
    this.selectedImageIndex.set(null);
    this.emitChanges();
  }

  private emitChanges(): void {
    this.imagesChange.emit([...this.imageList()]);
  }
}
