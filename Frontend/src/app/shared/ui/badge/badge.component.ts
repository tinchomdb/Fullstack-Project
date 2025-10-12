import { Component, input } from '@angular/core';
import { BadgeVariant, BadgeSize } from './badge.types';

@Component({
  selector: 'app-badge',
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss',
})
export class BadgeComponent {
  label = input.required<string>();
  variant = input<BadgeVariant>('default');
  size = input<BadgeSize>('md');
}
