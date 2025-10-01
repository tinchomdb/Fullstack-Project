import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-data-state',
  imports: [ButtonComponent],
  templateUrl: './data-state.component.html',
  styleUrl: './data-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-live': 'polite',
  },
})
export class DataStateComponent {
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly hasData = input(false);
  readonly retry = output<void>();

  // Customizable messages
  readonly loadingMessage = input('Loading data…');
  readonly emptyMessage = input('No data available yet. Check back soon!');
  readonly errorTitle = input('Could not load data.');
  readonly retryLabel = input('Try again');

  protected readonly showError = computed(() => !!this.error());
  protected readonly showLoading = computed(() => this.loading() && !this.error());
  protected readonly showEmpty = computed(
    () => !this.loading() && !this.error() && !this.hasData()
  );

  protected onRetry(): void {
    this.retry.emit();
  }
}
