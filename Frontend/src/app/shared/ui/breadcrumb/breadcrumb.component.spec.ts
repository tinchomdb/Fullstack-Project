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

    breadcrumbs.set([{ label: 'Home', route: '/' }]);
    expect(component['showBreadcrumbs']()).toBeFalse();
  });

  it('should show breadcrumbs with 2+ items', () => {
    breadcrumbs.set([
      { label: 'Home', route: '/' },
      { label: 'Products', route: '/products' },
    ]);
    expect(component['showBreadcrumbs']()).toBeTrue();
  });

  it('should not render the last item as a link', () => {
    breadcrumbs.set([
      { label: 'Home', route: '/products' },
      { label: 'Electronics', route: '/category/electronics' },
    ]);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll('a');
    const spans = fixture.nativeElement.querySelectorAll('span.current');

    expect(links.length).toBe(1);
    expect(links[0].textContent.trim()).toBe('Home');
    expect(spans.length).toBe(1);
    expect(spans[0].textContent.trim()).toBe('Electronics');
  });
});
