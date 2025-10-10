export type CartItemApiModel = {
  readonly productId?: string;
  readonly productName?: string;
  readonly imageUrl?: string;
  readonly sellerId?: string;
  readonly sellerName?: string;
  readonly quantity?: number;
  readonly unitPrice?: number;
  readonly lineTotal?: number;
};
