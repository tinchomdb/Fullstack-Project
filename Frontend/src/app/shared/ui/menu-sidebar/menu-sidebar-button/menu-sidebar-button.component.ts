import { ChangeDetectionStrategy, Component, output } from '@angular/core';

import { MenuIconComponent } from '../../icons/menu-icon.component';

@Component({
  selector: 'app-menu-sidebar-button',
  imports: [MenuIconComponent],
  templateUrl: './menu-sidebar-button.component.html',
  styleUrl: './menu-sidebar-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuSidebarButtonComponent {
  buttonClick = output<void>();
}
