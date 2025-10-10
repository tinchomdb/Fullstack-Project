import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

type PriceSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-product-price',
  template: `<span class="price">{{ formattedPrice() }}</span>`,
  styleUrl: './product-price.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class ProductPriceComponent {
  readonly price = input.required<number>();
  readonly currency = input('USD');
  readonly size = input<PriceSize>('md');

  protected readonly formattedPrice = computed(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency(),
    }).format(this.price());
  });
}
