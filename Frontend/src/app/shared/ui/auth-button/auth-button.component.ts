import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { LoginIconComponent } from '../icons/login-icon.component';
import { LogoutIconComponent } from '../icons/logout-icon.component';

@Component({
  selector: 'app-auth-button',
  imports: [LoginIconComponent, LogoutIconComponent],
  templateUrl: './auth-button.component.html',
  styleUrl: './auth-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthButtonComponent {
  private readonly authService = inject(AuthService);

  protected readonly isLoggedIn = this.authService.isLoggedIn;

  additionalClick = input<() => void>();

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }
}
