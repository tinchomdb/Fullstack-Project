import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CloseButtonComponent } from '../close-button/close-button.component';

@Component({
  selector: 'app-modal-form',
  imports: [CommonModule, CloseButtonComponent],
  templateUrl: './modal-form.component.html',
  styleUrls: ['./modal-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalFormComponent {
  title = input.required<string>();
  maxWidth = input<string>('600px');

  close = output<void>();

  onOverlayClick(): void {
    this.close.emit();
  }

  onCloseClick(): void {
    this.close.emit();
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
