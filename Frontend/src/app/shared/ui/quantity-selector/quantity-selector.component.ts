import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  effect,
} from '@angular/core';

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
      const newQuantity = current + 1;
      this.currentQuantity.set(newQuantity);
      this.quantityChange.emit(newQuantity);
    }
  }

  protected decrease(): void {
    const current = this.currentQuantity();
    if (current > 1) {
      const newQuantity = current - 1;
      this.currentQuantity.set(newQuantity);
      this.quantityChange.emit(newQuantity);
    }
  }
}
