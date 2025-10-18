import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { ThemeService } from '../../../core/services/theme.service';
import { SunIconComponent } from '../icons/sun-icon.component';
import { MoonIconComponent } from '../icons/moon-icon.component';

@Component({
  selector: 'app-theme-toggle',
  imports: [SunIconComponent, MoonIconComponent],
  templateUrl: './theme-toggle.component.html',
  styleUrl: './theme-toggle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  private readonly themeService = inject(ThemeService);

  readonly effectiveTheme = this.themeService.effectiveTheme;

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
