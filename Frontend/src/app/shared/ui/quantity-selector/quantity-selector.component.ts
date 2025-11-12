import { Component, ChangeDetectionStrategy, input, output, signal, effect } from '@angular/core';

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

  readonly quantityChange = output<number>();

  protected readonly currentQuantity = signal(1);

  constructor() {
    effect(() => {
      this.currentQuantity.set(this.quantity());
    });
  }

  protected increase(): void {
    const max = this.maxStock();
    const current = this.currentQuantity();

    if (max === undefined || current < max) {
      this.currentQuantity.update((q) => q + 1);
      this.quantityChange.emit(this.currentQuantity());
    }
  }

  protected decrease(): void {
    if (this.currentQuantity() > 1) {
      this.currentQuantity.update((q) => q - 1);
      this.quantityChange.emit(this.currentQuantity());
    }
  }
}
