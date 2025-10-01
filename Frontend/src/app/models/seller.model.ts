export interface Seller {
  readonly id: string;
  readonly displayName: string;
  readonly companyName?: string | null;
  readonly email: string;
}
