import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';

import { FiltersService } from '../../core/services/filters.service';
import { ProductListManager, PRODUCT_LIST_CONFIG } from '../../core/managers/product-list.manager';
import { HeadingComponent } from '../../shared/ui/heading/heading.component';
import { ProductListSectionComponent } from '../../shared/ui/product-list-section/product-list-section.component';

@Component({
  selector: 'app-search-results',
  imports: [HeadingComponent, ProductListSectionComponent],
  providers: [
    ProductListManager,
    { provide: PRODUCT_LIST_CONFIG, useValue: { loadFeatured: false } },
  ],
  templateUrl: './search-results.component.html',
  styleUrl: './search-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsComponent {
  private readonly listManager = inject(ProductListManager);
  private readonly filtersService = inject(FiltersService);

  protected readonly headingId = 'search-heading';

  protected readonly searchTerm = computed(() => {
    return this.filtersService.searchTerm() ?? '';
  });

  protected readonly loading = this.listManager.isLoadingInitial;
  protected readonly error = this.listManager.error;
  protected readonly products = this.listManager.products;
  protected readonly loadingMore = this.listManager.isLoadingMore;
  protected readonly hasMore = this.listManager.hasMore;

  protected readonly pageHeading = computed(() => {
    const term = this.searchTerm();
    return term ? `Results for "${term}"` : 'Search Results';
  });

  protected readonly resultsCount = computed(() => {
    return this.listManager.totalCount();
  });

  protected onLoadMore(): void {
    this.listManager.loadMore();
  }
}
