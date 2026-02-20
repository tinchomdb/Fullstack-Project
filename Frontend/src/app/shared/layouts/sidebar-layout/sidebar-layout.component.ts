import { Component, ChangeDetectionStrategy, input } from '@angular/core';

@Component({
  selector: 'app-sidebar-layout',
  imports: [],
  templateUrl: './sidebar-layout.component.html',
  styleUrl: './sidebar-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-sidebar-position]': 'sidebarMobilePosition()',
  },
})
export class SidebarLayoutComponent {
  readonly sidebarMobilePosition = input<'top' | 'bottom'>('top');
}
