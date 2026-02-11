import { Injectable, signal, effect, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentTheme = signal<Theme>('auto');
  private readonly systemTheme = signal<'light' | 'dark'>('light');

  readonly effectiveTheme = computed((): 'light' | 'dark' =>
    this.currentTheme() === 'auto' ? this.systemTheme() : (this.currentTheme() as 'light' | 'dark'),
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeTheme();
      this.watchSystemTheme();

      effect(() => {
        const effective = this.effectiveTheme();
        this.applyTheme(effective);
      });
    }
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('theme', theme);
    }
  }

  toggleTheme(): void {
    const current = this.currentTheme();
    if (current === 'auto') {
      const effective = this.effectiveTheme();
      this.setTheme(effective === 'light' ? 'dark' : 'light');
    } else {
      this.setTheme(current === 'light' ? 'dark' : 'light');
    }
  }

  private initializeTheme(): void {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved && ['light', 'dark', 'auto'].includes(saved)) {
      this.currentTheme.set(saved);
    }

    this.updateSystemTheme();
  }

  private watchSystemTheme(): void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      this.updateSystemTheme();
    });
  }

  private updateSystemTheme(): void {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.systemTheme.set(isDark ? 'dark' : 'light');
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
