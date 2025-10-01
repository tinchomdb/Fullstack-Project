import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/ui/navbar/navbar.component';
import { FooterComponent } from './shared/ui/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('Fullstack Marketplace');

  protected readonly navigation = signal([
    {
      label: 'Products',
      path: '/products',
      ariaLabel: 'Browse products',
    },
    {
      label: 'Cart',
      path: '/cart',
      ariaLabel: 'View your shopping cart',
    },
    {
      label: 'Sign In',
      path: '/sign-in',
      ariaLabel: 'Sign in to your account',
    },
    {
      label: 'Contact',
      path: '/contact',
      ariaLabel: 'Get in touch with us',
    },
  ] as const);

  protected readonly currentYear = new Date().getFullYear();
}
