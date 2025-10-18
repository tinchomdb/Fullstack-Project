import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { FiltersService } from '../../../core/services/filters.service';
import { SORT_OPTIONS } from '../../../core/models/sort-option.model';
import { DropdownComponent, DropdownOption } from '../dropdown/dropdown.component';

@Component({
  selector: 'app-sort-dropdown',
  imports: [DropdownComponent],
  templateUrl: './sort-dropdown.component.html',
  styleUrl: './sort-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortDropdownComponent {
  private readonly filtersService = inject(FiltersService);

  protected readonly sortOptions: DropdownOption[] = SORT_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));
  protected readonly currentSortOption = this.filtersService.currentSortOption;
  protected readonly currentSortValue = computed(() => this.currentSortOption().value);

  onSortChange(value: string): void {
    const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);
    if (selectedOption) {
      this.filtersService.setSortOption(selectedOption);
    }
  }
}
