import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { Seller } from '../../../core/models/seller.model';

type SellerInfoVariant = 'inline' | 'box';

@Component({
  selector: 'app-seller-info',
  templateUrl: './seller-info.component.html',
  styleUrl: './seller-info.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
  },
})
export class SellerInfoComponent {
  readonly seller = input.required<Seller>();
  readonly variant = input<SellerInfoVariant>('inline');
}
