import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-image-gallery',
  imports: [CommonModule],
  templateUrl: './product-image-gallery.component.html',
  styleUrl: './product-image-gallery.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductImageGalleryComponent {
  readonly images = input.required<readonly string[]>();
  readonly altText = input<string>('Product image');

  protected readonly selectedIndex = signal(0);

  protected selectImage(index: number): void {
    this.selectedIndex.set(index);
  }

  protected get currentImage(): string {
    const imgs = this.images();
    return imgs[this.selectedIndex()] ?? imgs[0] ?? '';
  }
}
