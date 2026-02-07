import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { AuthButtonComponent } from './auth-button.component';
import { AuthService } from '../../../core/auth/auth.service';

describe('AuthButtonComponent', () => {
  let fixture: ComponentFixture<AuthButtonComponent>;
  let component: AuthButtonComponent;
  let authSpy: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthService', ['login', 'logout'], {
      isLoggedIn: signal(false),
    });

    await TestBed.configureTestingModule({
      imports: [AuthButtonComponent],
      providers: [{ provide: AuthService, useValue: authSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate login to AuthService', () => {
    component.login();
    expect(authSpy.login).toHaveBeenCalled();
  });

  it('should delegate logout to AuthService', () => {
    component.logout();
    expect(authSpy.logout).toHaveBeenCalled();
  });

  it('should expose isLoggedIn from service', () => {
    expect(component['isLoggedIn']()).toBeFalse();
  });
});
