import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { SearchIconComponent } from '../icons/search-icon.component';

export interface SearchOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-search',
  imports: [SearchIconComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  readonly searchTerm = signal('');
  readonly placeholder = input<string>('Search...');

  readonly searchSubmitted = output<string>();

  onSearch(): void {
    const term = this.searchTerm().trim();
    if (!term) return;
    this.searchSubmitted.emit(term);
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }
}
