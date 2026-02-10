import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

@Component({
  selector: 'app-quantity-selector',
  templateUrl: './quantity-selector.component.html',
  styleUrl: './quantity-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantitySelectorComponent {
  readonly quantity = input.required<number>();
  readonly maxStock = input<number | undefined>(undefined);
  readonly disabled = input(false);

  readonly increaseClick = output<void>();
  readonly decreaseClick = output<void>();

  protected increase(): void {
    const max = this.maxStock();
    const current = this.quantity();

    if (max === undefined || current < max) {
      this.increaseClick.emit();
    }
  }

  protected decrease(): void {
    if (this.quantity() > 1) {
      this.decreaseClick.emit();
    }
  }
}
