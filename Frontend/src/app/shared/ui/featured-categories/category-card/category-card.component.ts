import { ChangeDetectionStrategy, Component, inject, input, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { Category } from '../../../../core/models/category.model';
import { CategoriesService } from '../../../../core/services/categories.service';
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

  private readonly categoriesService = inject(CategoriesService);

  protected readonly categoryUrl = computed(() => {
    const cat = this.category();
    return this.categoriesService.buildCategoryUrl(cat.id);
  });
}
