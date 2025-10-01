import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { HeadingComponent, HeadingLevel } from '../heading/heading.component';

@Component({
  selector: 'app-section-header',
  imports: [CommonModule, HeadingComponent],
  templateUrl: './section-header.component.html',
  styleUrl: './section-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SectionHeaderComponent {
  readonly headingId = input<string>('section-heading');
  readonly eyebrow = input<string | null>(null);
  readonly heading = input.required<string>();
  readonly subtitle = input<string | null>(null);
  readonly description = input<string | null>(null);
  readonly headingLevel = input<HeadingLevel>('h2');

  protected readonly ariaLabelledBy = computed(() => {
    const id = this.headingId();

    return id?.trim().length ? id : null;
  });
}
