import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { BreadcrumbComponent } from './breadcrumb.component';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { provideRouter } from '@angular/router';

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbComponent>;
  let component: BreadcrumbComponent;
  let breadcrumbs: ReturnType<typeof signal>;

  beforeEach(async () => {
    breadcrumbs = signal([]);

    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [provideRouter([]), { provide: BreadcrumbService, useValue: { breadcrumbs } }],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show breadcrumbs with 0 or 1 items', () => {
    expect(component['showBreadcrumbs']()).toBeFalse();

    breadcrumbs.set([{ label: 'Home', url: '/' }]);
    expect(component['showBreadcrumbs']()).toBeFalse();
  });

  it('should show breadcrumbs with 2+ items', () => {
    breadcrumbs.set([
      { label: 'Home', url: '/' },
      { label: 'Products', url: '/products' },
    ]);
    expect(component['showBreadcrumbs']()).toBeTrue();
  });
});
