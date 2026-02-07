import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { PLATFORM_ID } from '@angular/core';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    localStorage.removeItem('theme');
    service = TestBed.inject(ThemeService);
  });

  it('should start with auto theme', () => {
    expect(service.currentTheme()).toBe('auto');
  });

  it('should set theme', () => {
    service.setTheme('dark');
    expect(service.currentTheme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('should toggle from light to dark', () => {
    service.setTheme('light');
    service.toggleTheme();
    expect(service.currentTheme()).toBe('dark');
  });

  it('should toggle from dark to light', () => {
    service.setTheme('dark');
    service.toggleTheme();
    expect(service.currentTheme()).toBe('light');
  });

  it('should compute effective theme', () => {
    service.setTheme('dark');
    expect(service.effectiveTheme()).toBe('dark');

    service.setTheme('light');
    expect(service.effectiveTheme()).toBe('light');
  });

  it('should persist theme to localStorage', () => {
    service.setTheme('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
  });
});
