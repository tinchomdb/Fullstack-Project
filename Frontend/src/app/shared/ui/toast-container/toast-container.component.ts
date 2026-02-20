import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  templateUrl: './toast-container.component.html',
  styleUrl: './toast-container.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  private readonly toastService = inject(ToastService);
  protected readonly toasts = this.toastService.toasts;

  protected dismiss(id: number): void {
    this.toastService.dismiss(id);
  }

  protected trackById(_index: number, toast: Toast): number {
    return toast.id;
  }

  protected iconForVariant(variant: string): string {
    switch (variant) {
      case 'success':
        return 'check';
      case 'error':
        return 'x';
      case 'warning':
        return '!';
      case 'info':
      default:
        return 'i';
    }
  }
}
