import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import { Component } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { AuthService } from '../../../core/auth/auth.service';
import { provideRouter } from '@angular/router';

@Component({
  template: `<app-navbar [title]="'Test'" />`,
  imports: [NavbarComponent],
})
class TestHostComponent {}

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let categoriesSpy: jasmine.SpyObj<CategoriesService>;

  beforeEach(async () => {
    categoriesSpy = jasmine.createSpyObj(
      'CategoriesService',
      ['loadCategories', 'buildCategoryUrl'],
      {
        categories: signal([]),
        categoryTree: signal([]),
        loading: signal(false),
      },
    );
    categoriesSpy.buildCategoryUrl.and.returnValue('/category/electronics');

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        {
          provide: CartService,
          useValue: { itemCount: signal(3), loading: signal(false) },
        },
        { provide: CategoriesService, useValue: categoriesSpy },
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: signal(false),
            isAdmin: signal(false),
            login: jasmine.createSpy(),
            logout: jasmine.createSpy(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  function getComponent(): NavbarComponent {
    return fixture.debugElement.children[0].componentInstance;
  }

  it('should create', () => {
    expect(getComponent()).toBeTruthy();
  });

  it('should call loadCategories on construction', () => {
    expect(categoriesSpy.loadCategories).toHaveBeenCalled();
  });

  it('should toggle mobile menu', () => {
    const navbar = getComponent();
    expect(navbar['isMobileMenuOpen']()).toBeFalse();
    navbar.toggleMobileMenu();
    expect(navbar['isMobileMenuOpen']()).toBeTrue();
    navbar.toggleMobileMenu();
    expect(navbar['isMobileMenuOpen']()).toBeFalse();
  });

  it('should close mobile menu', () => {
    const navbar = getComponent();
    navbar.toggleMobileMenu();
    navbar.closeMobileMenu();
    expect(navbar['isMobileMenuOpen']()).toBeFalse();
  });

  it('should delegate getCategoryUrl to service', () => {
    const url = getComponent().getCategoryUrl('cat-1');
    expect(url).toBe('/category/electronics');
    expect(categoriesSpy.buildCategoryUrl).toHaveBeenCalledWith('cat-1');
  });

  it('should compute empty categories when none loaded', () => {
    expect(getComponent()['categories']()).toEqual([]);
  });
});
