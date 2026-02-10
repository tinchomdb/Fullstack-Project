import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface CreatePaymentIntentRequest {
  amount: number;
  email: string;
  cartId?: string;
  shippingCost: number;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  amount: number;
  paymentIntentId?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBase}/api/payments`;

  createPaymentIntent(
    request: CreatePaymentIntentRequest,
  ): Observable<CreatePaymentIntentResponse> {
    return this.http.post<CreatePaymentIntentResponse>(`${this.apiUrl}/create-intent`, request);
  }
}
