import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchIconComponent } from '../icons/search-icon.component';

export interface SearchOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-search',
  imports: [FormsModule, SearchIconComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SearchComponent {
  private readonly elementRef = inject(ElementRef);

  readonly searchTerm = signal('');
  readonly suggestions = input<SearchOption[]>([]);
  readonly placeholder = input<string>('Search...');
  readonly showSuggestions = input<boolean>(true);

  readonly search = output<string>();
  readonly suggestionSelected = output<string>();

  protected readonly isOpen = signal(false);
  protected readonly filteredSuggestions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term || !this.showSuggestions()) return [];
    return this.suggestions().filter((opt) =>
      opt.label.toLowerCase().includes(term)
    );
  });

  onSearch(): void {
    const term = this.searchTerm().trim();
    if (!term) return;
    this.search.emit(term);
    this.isOpen.set(false);
  }

  onSearchTermChange(): void {
    if (this.searchTerm().trim()) {
      this.isOpen.set(true);
    } else {
      this.isOpen.set(false);
    }
  }

  selectSuggestion(option: SearchOption): void {
    this.searchTerm.set(option.value);
    this.suggestionSelected.emit(option.value);
    this.isOpen.set(false);
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    const clickedInside = this.elementRef.nativeElement.contains(target);

    if (!clickedInside && this.isOpen()) {
      this.isOpen.set(false);
    }
  }
}
