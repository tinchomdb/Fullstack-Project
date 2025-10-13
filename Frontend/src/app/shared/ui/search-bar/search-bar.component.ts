import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FiltersService } from '../../../core/services/filters.service';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  private readonly filtersService = inject(FiltersService);

  readonly searchTerm = signal('');

  onSearch(): void {
    const term = this.searchTerm().trim();
    this.filtersService.setSearchTerm(term || null);
  }
}
