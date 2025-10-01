import { Component, inject, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CartService } from './cart.service';
import { Cart } from '../models/cart.model';
import { Resource } from '../shared/utils/resource';
import { DataStateComponent } from '../shared/ui/data-state/data-state.component';

@Component({
  selector: 'app-cart',
  imports: [CommonModule, DataStateComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartComponent implements OnInit {
  private readonly cartService = inject(CartService);

  protected readonly cartResource = new Resource<Cart | null>(null);

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.cartResource.load(this.cartService.getCurrentCart());
  }
}
