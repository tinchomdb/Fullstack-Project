import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Product } from '../../../core/models/product.model';
import { ProductGridComponent } from '../product-grid/product-grid.component';
import { SortDropdownComponent } from '../sort-dropdown/sort-dropdown.component';
import { LoadingIndicatorComponent } from '../loading-indicator/loading-indicator.component';
import { IntersectionObserverDirective } from '../intersection-observer.directive';
import { HeadingComponent, HeadingLevel } from '../heading/heading.component';

@Component({
  selector: 'app-product-list-section',
  imports: [
    ProductGridComponent,
    SortDropdownComponent,
    LoadingIndicatorComponent,
    IntersectionObserverDirective,
    HeadingComponent,
  ],
  templateUrl: './product-list-section.component.html',
  styleUrl: './product-list-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListSectionComponent {
  products = input.required<Product[]>();
  heading = input<string>('All Products');
  headingLevel = input<HeadingLevel>('h2');
  showHeading = input<boolean>(true);
  hasMore = input<boolean>(false);
  loadingMore = input<boolean>(false);
  emptyMessage = input<string>('No products found');
  endMessage = input<string>("You've reached the end of the catalog");
  currentSortValue = input<string>('');
  sortOptions = input<{ value: string; label: string }[]>([]);

  loadMore = output<void>();
  addToCart = output<Product>();
  sortChange = output<string>();

  protected onLoadMore(): void {
    if (this.loadingMore() || !this.hasMore()) {
      return;
    }
    this.loadMore.emit();
  }

  protected onAddToCart(product: Product): void {
    this.addToCart.emit(product);
  }

  protected onSortChange(value: string): void {
    this.sortChange.emit(value);
  }
}
