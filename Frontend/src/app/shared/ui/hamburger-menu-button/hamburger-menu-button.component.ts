import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-hamburger-menu-button',
  templateUrl: './hamburger-menu-button.component.html',
  styleUrl: './hamburger-menu-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HamburgerMenuButtonComponent {
  isExpanded = input.required<boolean>();
  toggle = output<void>();

  onToggle(): void {
    this.toggle.emit();
  }
}
