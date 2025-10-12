export type CarouselSlideApiModel = {
  readonly id?: string;
  readonly imageUrl?: string;
  readonly alt?: string;
  readonly order?: number;
  readonly isActive?: boolean;
  readonly createdAt?: string;
  readonly updatedAt?: string;
};

export type CreateCarouselSlideRequest = {
  readonly imageUrl: string;
  readonly alt: string;
  readonly isActive?: boolean;
};

export type UpdateCarouselSlideRequest = {
  readonly imageUrl?: string;
  readonly alt?: string;
  readonly order?: number;
  readonly isActive?: boolean;
};

export type ReorderCarouselSlidesRequest = {
  readonly slideIds: readonly string[];
};
