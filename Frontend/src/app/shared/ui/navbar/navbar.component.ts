import { Component, ChangeDetectionStrategy, inject, input, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { CategoriesService } from '../../../core/services/categories.service';
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
  private readonly cartService = inject(CartService);
  private readonly categoriesService = inject(CategoriesService);

  title = input.required<string>();

  protected readonly cartItemCount = this.cartService.itemCount;
  protected readonly isMobileMenuOpen = signal(false);
  protected readonly categories = computed(() => this.categoriesService.categories() ?? []);

  constructor() {
    this.categoriesService.loadCategories();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  getCategoryUrl(categoryId: string): string {
    return this.categoriesService.buildCategoryUrl(categoryId);
  }
}
