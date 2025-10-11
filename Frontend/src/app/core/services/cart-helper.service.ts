import { Injectable } from '@angular/core';

import { Cart } from '../models/cart.model';
import { CartItem } from '../models/cart-item.model';
import { CartStatus } from '../models/cart-status.model';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class CartHelperService {
  calculateLineTotal(unitPrice: number, quantity: number): number {
    return unitPrice * quantity;
  }

  createCartItem(product: Product, quantity: number): CartItem {
    return {
      productId: product.id,
      productName: product.name,
      imageUrl: product.imageUrls[0] ?? '',
      quantity,
      unitPrice: product.price,
      lineTotal: this.calculateLineTotal(product.price, quantity),
      sellerId: product.seller.id,
      sellerName: product.seller.displayName,
    };
  }

  createNewCart(userId: string, product: Product, quantity: number): Cart {
    const cartItem = this.createCartItem(product, quantity);
    const itemTotal = this.calculateLineTotal(product.price, quantity);

    return {
      id: crypto.randomUUID(),
      userId,
      status: CartStatus.Active,
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      items: [cartItem],
      subtotal: itemTotal,
      currency: 'USD',
      total: itemTotal,
    };
  }

  updateItemQuantity(item: CartItem, newQuantity: number): CartItem {
    return {
      ...item,
      quantity: newQuantity,
      lineTotal: this.calculateLineTotal(item.unitPrice, newQuantity),
    };
  }

  addItemToCart(
    items: readonly CartItem[],
    product: Product,
    quantity: number,
  ): readonly CartItem[] {
    const existingItemIndex = items.findIndex((item) => item.productId === product.id);

    if (existingItemIndex >= 0) {
      const existingItem = items[existingItemIndex];
      const newQuantity = existingItem.quantity + quantity;
      const updatedItem = this.updateItemQuantity(existingItem, newQuantity);
      return items.map((item, i) => (i === existingItemIndex ? updatedItem : item));
    }

    return [...items, this.createCartItem(product, quantity)];
  }

  removeItemFromCart(items: readonly CartItem[], productId: string): readonly CartItem[] {
    return items.filter((item) => item.productId !== productId);
  }

  updateItemQuantityInCart(
    items: readonly CartItem[],
    productId: string,
    quantity: number,
  ): readonly CartItem[] {
    return items.map((item) =>
      item.productId === productId ? this.updateItemQuantity(item, quantity) : item,
    );
  }

  recalculateCartTotals(cart: Cart, items: readonly CartItem[]): Cart {
    const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

    return {
      ...cart,
      items,
      subtotal,
      total: subtotal,
      lastUpdatedAt: new Date().toISOString(),
    };
  }
}
