import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ButtonComponent } from '../../shared/ui/button/button.component';

@Component({
  selector: 'app-admin',
  imports: [RouterLink, RouterOutlet, ButtonComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminComponent {
  readonly activeTab = signal<'products' | 'categories' | 'carousel'>('products');

  setActiveTab(tab: 'products' | 'categories' | 'carousel'): void {
    this.activeTab.set(tab);
  }
}
