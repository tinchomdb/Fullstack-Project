import { Component, ChangeDetectionStrategy, input } from '@angular/core';

import { FacebookIconComponent } from '../icons/facebook-icon.component';
import { XTwitterIconComponent } from '../icons/x-twitter-icon.component';
import { InstagramIconComponent } from '../icons/instagram-icon.component';
import { VisaIconComponent } from '../icons/visa-icon.component';
import { MastercardIconComponent } from '../icons/mastercard-icon.component';
import { PaypalIconComponent } from '../icons/paypal-icon.component';

@Component({
  selector: 'app-footer',
  imports: [
    FacebookIconComponent,
    XTwitterIconComponent,
    InstagramIconComponent,
    VisaIconComponent,
    MastercardIconComponent,
    PaypalIconComponent,
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  currentYear = input.required<number>();
}
