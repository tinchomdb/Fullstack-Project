import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { CategoriesService } from '../../../core/services/categories.service';
import { AuthService } from '../../../core/auth/auth.service';
import { MenuSidebarButtonComponent } from './menu-sidebar-button/menu-sidebar-button.component';
import { MenuSidebarPanelComponent } from './menu-sidebar-panel/menu-sidebar-panel.component';

@Component({
  selector: 'app-menu-sidebar',
  imports: [MenuSidebarButtonComponent, MenuSidebarPanelComponent],
  templateUrl: './menu-sidebar.component.html',
  styleUrl: './menu-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class MenuSidebarComponent {
  private readonly categoriesService = inject(CategoriesService);
  private readonly authService = inject(AuthService);

  protected readonly isOpen = signal(false);
  protected readonly categoryTree = this.categoriesService.categoryTree;
  protected readonly loading = this.categoriesService.loading;
  protected readonly isLoggedIn = this.authService.isLoggedIn;
  protected readonly isAdmin = this.authService.isAdmin;

  toggleSidebar(): void {
    this.isOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.isOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-menu-sidebar') && !target.closest('.sidebar-panel')) {
      this.closeSidebar();
    }
  }

  logout(): void {
    this.authService.logout();
    this.closeSidebar();
  }
}
