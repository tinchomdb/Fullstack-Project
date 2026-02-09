import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NavbarComponent } from './navbar.component';
import { Component } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { CategoriesService } from '../../../core/services/categories.service';
import { provideRouter } from '@angular/router';
import { Category } from '../../../core/models/category.model';

const mockCategories: Category[] = [
  {
    id: 'cat-1',
    name: 'Electronics',
    slug: 'electronics',
    subcategoryIds: [],
    type: 'Category',
    url: '/category/electronics',
  },
];

@Component({
  template: `<app-navbar
    [title]="'Test'"
    [cartItemCount]="cartItemCount"
    [categories]="categories"
  />`,
  imports: [NavbarComponent],
})
class TestHostComponent {
  cartItemCount = 3;
  categories: readonly Category[] = mockCategories;
}

describe('NavbarComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isLoggedIn: signal(false),
            isAdmin: signal(false),
            login: jasmine.createSpy(),
            logout: jasmine.createSpy(),
          },
        },
        {
          provide: CategoriesService,
          useValue: {
            categoryTree: signal([]),
            loading: signal(false),
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

  it('should receive cartItemCount via input', () => {
    expect(getComponent().cartItemCount()).toBe(3);
  });

  it('should receive categories via input', () => {
    expect(getComponent().categories()).toEqual(mockCategories);
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
});
