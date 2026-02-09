export interface Category {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly description?: string;
  readonly image?: string;
  readonly featured?: boolean;
  readonly parentCategoryId?: string;
  readonly subcategoryIds: readonly string[];
  readonly type: string;
  readonly url: string;
}
