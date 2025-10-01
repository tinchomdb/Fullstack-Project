import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type HeadingLevel = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

@Component({
  selector: 'app-heading',
  templateUrl: './heading.component.html',
  styleUrl: './heading.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadingComponent {
  readonly level = input<HeadingLevel>('h2');
  readonly headingId = input<string | null>(null);
  readonly content = input.required<string>();
}
