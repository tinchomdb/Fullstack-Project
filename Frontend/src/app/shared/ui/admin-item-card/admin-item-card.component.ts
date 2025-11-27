import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { BadgeComponent } from '../badge/badge.component';
import { Badge } from '../badge/badge.types';

@Component({
  selector: 'app-admin-item-card',
  templateUrl: './admin-item-card.component.html',
  styleUrl: './admin-item-card.component.scss',
  imports: [ButtonComponent, BadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminItemCardComponent {
  imageUrl = input<string>();
  imageAlt = input<string>('');
  title = input.required<string>();
  description = input<string>();
  badges = input<Badge[]>([]);
  metadata = input<Array<{ label: string; value: string }>>([]);
  level = input<number>(0);
  showTreeIndicator = input<boolean>(false);

  edit = output<void>();
  delete = output<void>();
}
