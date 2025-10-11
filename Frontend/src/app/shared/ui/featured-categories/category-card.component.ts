import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgOptimizedImage } from '@angular/common';

import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-card',
  imports: [RouterLink, NgOptimizedImage],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryCardComponent {
  category = input.required<Category>();
}
