import { SellerProfile } from './seller-profile.model';
import { ShippingAddress } from './shipping-address.model';

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly phoneNumber?: string;
  readonly roles: readonly string[];
  readonly sellerProfile?: SellerProfile;
  readonly shippingAddresses: readonly ShippingAddress[];
  readonly createdAt: string;
  readonly lastLoginAt: string;
  readonly type: string;
}
