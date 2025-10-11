import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ChevronIconComponent } from '../../icons/chevron-icon.component';
import { MenuIconComponent } from '../../icons/menu-icon.component';

@Component({
  selector: 'app-category-selector-button',
  imports: [MenuIconComponent, ChevronIconComponent],
  templateUrl: './category-selector-button.component.html',
  styleUrl: './category-selector-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySelectorButtonComponent {
  isExpanded = input<boolean>(false);
  buttonClick = output<void>();
}
