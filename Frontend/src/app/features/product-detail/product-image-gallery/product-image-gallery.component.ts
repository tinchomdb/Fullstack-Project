import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-product-image-gallery',
  imports: [],
  templateUrl: './product-image-gallery.component.html',
  styleUrl: './product-image-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductImageGalleryComponent {
  readonly images = input.required<readonly string[]>();
  readonly altText = input<string>('Product image');

  protected readonly selectedIndex = signal(0);

  protected readonly currentImage = computed(() => {
    const imgs = this.images();
    return imgs[this.selectedIndex()] ?? imgs[0] ?? '';
  });

  protected selectImage(index: number): void {
    this.selectedIndex.set(index);
  }
}
