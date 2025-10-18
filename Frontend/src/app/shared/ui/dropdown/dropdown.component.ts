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
import { ChevronIconComponent } from '../icons/chevron-icon.component';

export interface DropdownOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-dropdown',
  imports: [ChevronIconComponent],
  templateUrl: './dropdown.component.html',
  styleUrl: './dropdown.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class DropdownComponent {
  private readonly elementRef = inject(ElementRef);

  readonly options = input.required<DropdownOption[]>();
  readonly selectedValue = input.required<string>();
  readonly placeholder = input<string>('Select an option');

  readonly selectionChange = output<string>();

  protected readonly isOpen = signal(false);
  protected readonly displayLabel = computed(() => {
    const selected = this.options().find((opt) => opt.value === this.selectedValue());
    return selected?.label || this.placeholder();
  });

  toggleDropdown(): void {
    this.isOpen.update((open) => !open);
  }

  selectOption(option: DropdownOption): void {
    this.selectionChange.emit(option.value);
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
