import { SellerProfile } from './seller-profile.model';
import { ShippingAddress } from './shipping-address.model';

export interface User {
  id: string;
  email: string;
  name: string;
  phoneNumber?: string;
  roles: string[];
  sellerProfile?: SellerProfile;
  shippingAddresses: ShippingAddress[];
  createdAt: string;
  lastLoginAt: string;
  type: string;
}
