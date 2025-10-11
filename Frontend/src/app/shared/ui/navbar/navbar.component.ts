import { Component, ChangeDetectionStrategy, inject, input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { AuthButtonComponent } from '../auth-button/auth-button.component';
import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';
import { CategorySelectorComponent } from '../category-selector/category-selector.component';

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
    CategorySelectorComponent,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly cartService = inject(CartService);

  title = input.required<string>();
  navigation = input.required<readonly NavItem[]>();

  protected readonly cartItemCount = this.cartService.itemCount;
  protected readonly isMobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }
}
