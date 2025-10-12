import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-form',
  imports: [CommonModule],
  templateUrl: './modal-form.component.html',
  styleUrls: ['./modal-form.component.scss'],
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
