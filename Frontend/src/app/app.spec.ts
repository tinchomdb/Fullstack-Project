import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component, signal } from '@angular/core';
import { App } from './app';
import { NavbarComponent } from './shared/ui/navbar/navbar.component';
import { FooterComponent } from './shared/ui/footer/footer.component';
import { LoadingOverlayComponent } from './shared/ui/loading-overlay/loading-overlay.component';
import { BreadcrumbComponent } from './shared/ui/breadcrumb/breadcrumb.component';
import { AuthService } from './core/auth/auth.service';
import { CartService } from './core/services/cart.service';
import { CategoriesService } from './core/services/categories.service';
import { BreadcrumbService } from './core/services/breadcrumb.service';
import { LoadingOverlayService } from './core/services/loading-overlay.service';

@Component({ selector: 'app-navbar', template: '' })
class MockNavbarComponent {}

@Component({ selector: 'app-footer', template: '' })
class MockFooterComponent {}

@Component({ selector: 'app-loading-overlay', template: '' })
class MockLoadingOverlayComponent {}

@Component({ selector: 'app-breadcrumb', template: '' })
class MockBreadcrumbComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: signal(false),
            isAdmin: signal(false),
            authInitialized: signal(true),
            userId: signal(undefined),
          },
        },
        {
          provide: CartService,
          useValue: {
            cart: signal(null),
            loading: signal(false),
            error: signal(null),
            itemCount: signal(0),
            isEmpty: signal(true),
            cartReady: signal(true),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            categories: signal([]),
            categoryTree: signal([]),
            loading: signal(false),
            loadCategories: jasmine.createSpy('loadCategories'),
          },
        },
        {
          provide: BreadcrumbService,
          useValue: { breadcrumbs: signal([]) },
        },
        {
          provide: LoadingOverlayService,
          useValue: { visible: signal({ visible: false, message: '' }) },
        },
      ],
    })
      .overrideComponent(App, {
        remove: {
          imports: [NavbarComponent, FooterComponent, LoadingOverlayComponent, BreadcrumbComponent],
        },
        add: {
          imports: [
            MockNavbarComponent,
            MockFooterComponent,
            MockLoadingOverlayComponent,
            MockBreadcrumbComponent,
          ],
        },
      })
      .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
