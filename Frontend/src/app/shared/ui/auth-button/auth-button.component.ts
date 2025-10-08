import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-auth-button',
  imports: [],
  templateUrl: './auth-button.component.html',
  styleUrl: './auth-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthButtonComponent {
  private readonly authService = inject(AuthService);

  protected readonly loginDisplay = this.authService.loginDisplay;

  additionalClick = input<() => void>();

  login(): void {
    this.authService.login();
  }

  logout(): void {
    this.authService.logout();
  }
}
