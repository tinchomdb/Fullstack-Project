import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { Category } from '../../../../core/models/category.model';
import { BadgeComponent } from '../../badge/badge.component';

export type CardVariant = 'horizontal' | 'vertical';

export const CARD_VARIANT = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
} as const;

@Component({
  selector: 'app-category-card',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage, BadgeComponent],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCardComponent {
  category = input.required<Category>();
  variant = input<CardVariant>(CARD_VARIANT.VERTICAL);
  index = input<number>(0);
  categoryUrl = input.required<string>();
}
