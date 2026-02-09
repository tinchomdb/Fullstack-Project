import { Component, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { Category } from '../../../core/models/category.model';
import { AuthButtonComponent } from '../auth-button/auth-button.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { MenuSidebarComponent } from '../menu-sidebar/menu-sidebar.component';
import { CartButtonComponent } from '../cart-button/cart-button.component';
import { SearchBarComponent } from '../search-bar/search-bar.component';

export interface NavItem {
  label: string;
  path: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    AuthButtonComponent,
    ThemeToggleComponent,
    MenuSidebarComponent,
    CartButtonComponent,
    SearchBarComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  title = input.required<string>();
  cartItemCount = input<number>(0);
  categories = input<readonly Category[]>([]);

  protected readonly isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
