export interface SellerProfile {
  readonly storeName: string;
  readonly storeDescription?: string;
  readonly logoUrl?: string;
  readonly averageRating: number;
  readonly totalProducts: number;
  readonly totalOrders: number;
  readonly totalReviews: number;
  readonly lastProductAddedAt?: string;
}
