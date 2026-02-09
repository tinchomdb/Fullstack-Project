import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DropdownComponent, DropdownOption } from '../dropdown/dropdown.component';

@Component({
  selector: 'app-sort-dropdown',
  imports: [DropdownComponent],
  templateUrl: './sort-dropdown.component.html',
  styleUrl: './sort-dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortDropdownComponent {
  readonly currentValue = input<string>('');
  readonly options = input<DropdownOption[]>([]);

  readonly sortChange = output<string>();

  onSortChange(value: string): void {
    this.sortChange.emit(value);
  }
}
