export interface OrderItem {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly lineTotal: number;
}
