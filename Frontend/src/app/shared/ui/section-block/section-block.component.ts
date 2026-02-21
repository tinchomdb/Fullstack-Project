import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-section-block',
  imports: [],
  templateUrl: './section-block.component.html',
  styleUrl: './section-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.alt]': 'alt()',
  },
})
export class SectionBlockComponent {
  readonly alt = input(false);
  readonly centered = input(true);
  readonly heading = input<string>();
  readonly subtitle = input<string>();
}
