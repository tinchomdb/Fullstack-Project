export interface CartItem {
  readonly productId: string;
  readonly productName: string;
  readonly slug: string;
  readonly imageUrl: string;
  readonly sellerId: string;
  readonly sellerName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
}
