import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
} from '@angular/core';

import { FiltersService } from '../../../core/services/filters.service';
import { SORT_OPTIONS, SortOption } from '../../../core/models/sort-option.model';
import { ChevronIconComponent } from '../icons/chevron-icon.component';

@Component({
  selector: 'app-sort-dropdown',
  imports: [ChevronIconComponent],
  templateUrl: './sort-dropdown.component.html',
  styleUrl: './sort-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class SortDropdownComponent {
  private readonly filtersService = inject(FiltersService);
  private readonly elementRef = inject(ElementRef);

  protected readonly isOpen = signal(false);
  protected readonly sortOptions = SORT_OPTIONS;
  protected readonly currentSortOption = this.filtersService.currentSortOption;

  protected readonly displayLabel = computed(() => `Sort by: ${this.currentSortOption().label}`);

  toggleDropdown(): void {
    this.isOpen.update((open) => !open);
  }

  selectOption(option: SortOption): void {
    this.filtersService.setSortOption(option);
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
