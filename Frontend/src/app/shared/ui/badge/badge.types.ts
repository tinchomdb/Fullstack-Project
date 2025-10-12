export type BadgeVariant = 'featured' | 'info' | 'success' | 'warning' | 'danger' | 'default';

export type BadgeSize = 'sm' | 'md';

export interface Badge {
  label: string;
  variant: BadgeVariant;
  size?: BadgeSize;
}
