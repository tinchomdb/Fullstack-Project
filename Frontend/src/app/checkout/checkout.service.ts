import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CartService } from '../cart/cart.service';
import { Order } from '../models/order.model';

export interface CheckoutRequest {
  shippingCost: number;
  shippingDetails: ShippingDetails;
  paymentMethod: string;
}

export interface ShippingDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly cartService = inject(CartService);

  processCheckout(request: CheckoutRequest): Observable<Order> {
    // Use the cart service's checkout method
    return this.cartService.checkout(request.shippingCost);
  }

  validateShippingDetails(details: ShippingDetails): string[] {
    const errors: string[] = [];

    if (!details.firstName?.trim()) {
      errors.push('First name is required');
    }

    if (!details.lastName?.trim()) {
      errors.push('Last name is required');
    }

    if (!details.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) {
      errors.push('Valid email is required');
    }

    if (!details.address?.trim()) {
      errors.push('Address is required');
    }

    if (!details.city?.trim()) {
      errors.push('City is required');
    }

    if (!details.state?.trim()) {
      errors.push('State is required');
    }

    if (!details.zipCode?.trim()) {
      errors.push('ZIP code is required');
    } else if (!/^\d{5}(-\d{4})?$/.test(details.zipCode)) {
      errors.push('Valid ZIP code is required');
    }

    return errors;
  }

  calculateShippingCost(option: string): number {
    const shippingOptions = {
      standard: 5.99,
      express: 12.99,
      overnight: 24.99,
    };

    return shippingOptions[option as keyof typeof shippingOptions] ?? 0;
  }
}
