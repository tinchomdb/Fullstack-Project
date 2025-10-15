import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FiltersService } from '../../../core/services/filters.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  private readonly router = inject(Router);
  readonly searchTerm = signal('');

  onSearch(): void {
    const term = this.searchTerm().trim();
    if (!term) return;

    this.router.navigate(['/search'], {
      queryParams: { q: term },
    });
  }
}
