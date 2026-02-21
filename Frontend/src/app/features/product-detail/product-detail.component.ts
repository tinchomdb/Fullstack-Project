import { Component, inject, signal, ChangeDetectionStrategy, input, effect } from '@angular/core';

import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';
import { ProductImageGalleryComponent } from './product-image-gallery/product-image-gallery.component';
import { ProductBuyBoxComponent } from './product-buy-box/product-buy-box.component';
import { ProductInfoComponent } from './product-info/product-info.component';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { SectionBlockComponent } from '../../shared/ui/section-block/section-block.component';

@Component({
  selector: 'app-product-detail',
  imports: [
    ProductImageGalleryComponent,
    ProductBuyBoxComponent,
    ProductInfoComponent,
    SectionBlockComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent {
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);
  private readonly breadcrumbService = inject(BreadcrumbService);

  readonly slug = input.required<string>();

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly quantity = signal(1);
  protected readonly addingToCart = signal(false);

  constructor() {
    effect(() => {
      this.loadProduct(this.slug());
    });
  }

  protected increaseQuantity(): void {
    this.quantity.update((q) => q + 1);
  }

  protected decreaseQuantity(): void {
    this.quantity.update((q) => (q > 1 ? q - 1 : q));
  }

  protected addToCart(): void {
    const prod = this.product();
    if (!prod) return;

    this.addingToCart.set(true);
    this.cartService.addToCart(prod, this.quantity());

    // Simulate a brief delay for UX feedback
    setTimeout(() => {
      this.addingToCart.set(false);
      // Optionally navigate to cart or show a toast
    }, 500);
  }

  protected buyNow(): void {
    this.addToCart();
    setTimeout(() => {
      this.router.navigate(['/cart']);
    }, 600);
  }

  private loadProduct(slug: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsService
      .getProductBySlug(slug)
      .pipe(
        finalize(() => {
          this.updateBreadcrumbs();
          this.loading.set(false);
        }),
      )
      .subscribe({
        next: (product) => {
          this.product.set(product);
        },
        error: (err) => {
          console.error('Error loading product:', err);
          this.error.set('Failed to load product. Please try again.');
        },
      });
  }

  private updateBreadcrumbs(): void {
    this.breadcrumbService.updateBreadcrumbsForProductDetailsPage(
      this.product()?.name || 'Product',
      this.product()?.categoryIds[0] || 'Product',
    );
  }
}
