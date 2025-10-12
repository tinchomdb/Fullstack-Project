import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BreadcrumbComponent {
  private readonly breadcrumbService = inject(BreadcrumbService);

  protected readonly items = this.breadcrumbService.breadcrumbs;
  protected readonly separator = '›';
  protected readonly showBreadcrumbs = computed(() => this.items().length > 1);
}
