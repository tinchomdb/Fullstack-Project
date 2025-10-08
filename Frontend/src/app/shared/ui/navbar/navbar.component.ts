import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { CartService } from '../../../cart/cart.service';

export interface NavItem {
  label: string;
  path: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  private readonly cartService = inject(CartService);

  title = input.required<string>();
  navigation = input.required<readonly NavItem[]>();

  protected readonly cartItemCount = this.cartService.itemCount;
}
