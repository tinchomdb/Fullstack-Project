import { Component, ChangeDetectionStrategy, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { SearchComponent } from '../search/search.component';

@Component({
  selector: 'app-search-bar',
  imports: [SearchComponent],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  private readonly router = inject(Router);

  searched = output<void>();

  onSearch(term: string): void {
    this.router.navigate(['/search'], {
      queryParams: { q: term },
    });
    this.searched.emit();
  }
}
