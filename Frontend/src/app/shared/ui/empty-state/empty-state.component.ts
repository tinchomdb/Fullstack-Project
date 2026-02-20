import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { SearchIconComponent } from '../icons/search-icon.component';
import { PackageIconComponent } from '../icons/package-icon.component';
import { ImageIconComponent } from '../icons/image-icon.component';
import { FolderIconComponent } from '../icons/folder-icon.component';

export type EmptyStateIcon = 'search' | 'package' | 'image' | 'folder';

@Component({
  selector: 'app-empty-state',
  imports: [
    ButtonComponent,
    SearchIconComponent,
    PackageIconComponent,
    ImageIconComponent,
    FolderIconComponent,
  ],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  readonly icon = input<EmptyStateIcon>('search');
  readonly heading = input.required<string>();
  readonly description = input<string>('');
  readonly ctaLabel = input<string>('');
  readonly ctaAction = input<() => void>();

  protected onCtaClick(): void {
    const action = this.ctaAction();
    if (action) {
      action();
    }
  }
}
