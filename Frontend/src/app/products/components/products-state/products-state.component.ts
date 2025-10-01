import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '../../../shared/ui/button/button.component';

@Component({
  selector: 'app-products-state',
  imports: [CommonModule, ButtonComponent],
  templateUrl: './products-state.component.html',
  styleUrl: './products-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-live': 'polite',
  },
})
export class ProductsStateComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly hasProducts = input(false);
  readonly retry = output<void>();

  protected readonly showError = computed(() => !!this.error());
  protected readonly showLoading = computed(() => this.loading() && !this.error());
  protected readonly showEmpty = computed(
    () => !this.loading() && !this.error() && !this.hasProducts()
  );

  protected onRetry(): void {
    this.retry.emit();
  }
}
