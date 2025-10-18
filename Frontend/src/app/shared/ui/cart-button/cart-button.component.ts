import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartIconComponent } from '../icons/cart-icon.component';

@Component({
  selector: 'app-cart-button',
  imports: [RouterLink, RouterLinkActive, CartIconComponent],
  templateUrl: './cart-button.component.html',
  styleUrl: './cart-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartButtonComponent {
  itemCount = input.required<number>();
}
