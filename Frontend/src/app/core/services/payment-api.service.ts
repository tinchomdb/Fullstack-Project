import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface CreatePaymentIntentRequest {
  amount: number;
  email: string;
  cartId?: string;
  userId?: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  amount: number;
  paymentIntentId?: string;
}

export interface TestCompletePaymentRequest {
  paymentIntentId: string;
  cartId: string;
  userId: string;
  email: string;
  amount: number;
}

export interface TestCompletePaymentResponse {
  success: boolean;
  message: string;
  orderId?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBase}/api/payments`;
  private readonly testPaymentUrl = `${environment.apiBase}/api/testpayment`;

  createPaymentIntent(
    request: CreatePaymentIntentRequest,
  ): Observable<CreatePaymentIntentResponse> {
    return this.http.post<CreatePaymentIntentResponse>(`${this.apiUrl}/create-intent`, request);
  }

  testCompletePayment(
    request: TestCompletePaymentRequest,
  ): Observable<TestCompletePaymentResponse> {
    return this.http.post<TestCompletePaymentResponse>(
      `${this.testPaymentUrl}/test/complete-payment`,
      request,
    );
  }
}
