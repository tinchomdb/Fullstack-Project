import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { LoadingOverlayService } from '../../../core/services/loading-overlay.service';

@Component({
  selector: 'app-loading-overlay',
  templateUrl: './loading-overlay.component.html',
  styleUrl: './loading-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOverlayComponent {
  private loadingService = inject(LoadingOverlayService);

  protected state = this.loadingService.visible;
}
