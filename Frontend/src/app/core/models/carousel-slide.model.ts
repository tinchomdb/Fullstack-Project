export interface CarouselSlide {
  readonly id: string;
  readonly imageUrl: string;
  readonly alt: string;
  readonly order: number;
  readonly isActive: boolean;
}
