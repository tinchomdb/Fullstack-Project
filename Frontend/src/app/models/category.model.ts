export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  featured?: boolean;
  parentCategoryId?: string;
  subcategoryIds: string[];
  type: string;
}
