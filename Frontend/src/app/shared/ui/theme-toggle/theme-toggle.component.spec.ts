import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ThemeToggleComponent } from './theme-toggle.component';
import { ThemeService } from '../../../core/services/theme.service';

describe('ThemeToggleComponent', () => {
  let fixture: ComponentFixture<ThemeToggleComponent>;
  let component: ThemeToggleComponent;
  let themeSpy: jasmine.SpyObj<ThemeService>;

  beforeEach(async () => {
    themeSpy = jasmine.createSpyObj('ThemeService', ['toggleTheme'], {
      effectiveTheme: signal('light'),
    });

    await TestBed.configureTestingModule({
      imports: [ThemeToggleComponent],
      providers: [{ provide: ThemeService, useValue: themeSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemeToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate toggleTheme to service', () => {
    component.toggleTheme();
    expect(themeSpy.toggleTheme).toHaveBeenCalled();
  });

  it('should expose effectiveTheme from service', () => {
    expect(component.effectiveTheme()).toBe('light');
  });
});
