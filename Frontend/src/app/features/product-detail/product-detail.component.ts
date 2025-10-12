import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ProductsService } from '../../core/services/products.service';
import { CartService } from '../../core/services/cart.service';
import { Product } from '../../core/models/product.model';
import { ProductImageGalleryComponent } from './product-image-gallery/product-image-gallery.component';
import { ProductBuyBoxComponent } from './product-buy-box/product-buy-box.component';
import { ProductInfoComponent } from './product-info/product-info.component';

@Component({
  selector: 'app-product-detail',
  imports: [
    CommonModule,
    ProductImageGalleryComponent,
    ProductBuyBoxComponent,
    ProductInfoComponent,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productsService = inject(ProductsService);
  private readonly cartService = inject(CartService);

  protected readonly product = signal<Product | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly quantity = signal(1);
  protected readonly addingToCart = signal(false);

  private productId = '';
  private sellerId = '';

  protected onQuantityChange(newQuantity: number): void {
    this.quantity.set(newQuantity);
  }

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    const sellerId = this.route.snapshot.queryParamMap.get('sellerId');

    if (!productId || !sellerId) {
      this.error.set('Invalid product parameters');
      this.loading.set(false);
      return;
    }

    this.productId = productId;
    this.sellerId = sellerId;
    this.loadProduct(productId, sellerId);
  }

  protected retry(): void {
    if (this.productId && this.sellerId) {
      this.loadProduct(this.productId, this.sellerId);
    }
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

  private loadProduct(productId: string, sellerId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.productsService
      .getProduct(productId, sellerId)
      .pipe(
        finalize(() => {
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
}
