export interface SellerProfile {
  storeName: string;
  storeDescription?: string;
  logoUrl?: string;
  averageRating: number;
  totalProducts: number;
  totalOrders: number;
  totalReviews: number;
  lastProductAddedAt?: string;
}
