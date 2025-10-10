import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

type StockStatusVariant = 'inline' | 'badge';

@Component({
  selector: 'app-stock-status',
  templateUrl: './stock-status.component.html',
  styleUrl: './stock-status.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-status]': 'statusType()',
  },
})
export class StockStatusComponent {
  readonly stock = input<number | undefined>(undefined);
  readonly variant = input<StockStatusVariant>('inline');

  protected readonly inStock = computed(() => {
    const stockValue = this.stock();
    return stockValue === undefined || stockValue > 0;
  });

  protected readonly statusType = computed(() => {
    const stockValue = this.stock();
    if (stockValue === undefined || stockValue > 10) return 'in-stock';
    if (stockValue === 0) return 'out-of-stock';
    return 'low-stock';
  });

  protected readonly statusText = computed(() => {
    const stockValue = this.stock();
    if (stockValue === undefined) return 'In Stock';
    if (stockValue === 0) return 'Out of Stock';
    if (stockValue < 10) return `Only ${stockValue} left in stock`;
    return 'In Stock';
  });
}
