import { User } from '../types';
import { apiFetch } from './http';

interface CustomerProfileResponse {
  user: {
    id?: number | string;
    email?: string;
    first_name?: string;
    last_name?: string;
    billing?: {
      phone?: string;
      address_1?: string;
      city?: string;
      postcode?: string;
      country?: string;
      state?: string;
    };
    shipping?: {
      address_1?: string;
    };
  };
}

function mapProfileToUser(profile: CustomerProfileResponse['user']): User {
  const billing = profile?.billing || {};
  const shipping = profile?.shipping || {};
  const billingAddress = String(billing.address_1 || '').trim();
  const shippingAddress = String(shipping.address_1 || '').trim();

  return {
    id: profile?.id,
    firstName: String(profile?.first_name || ''),
    lastName: String(profile?.last_name || ''),
    email: String(profile?.email || ''),
    address: shippingAddress || billingAddress,
    phone: String(billing.phone || ''),
    city: String(billing.city || ''),
    postcode: String(billing.postcode || ''),
    country: String(billing.country || ''),
    state: String(billing.state || ''),
    billingAddress,
    shippingAddress,
  };
}

export async function fetchCustomerProfile(): Promise<User> {
  const data = await apiFetch<CustomerProfileResponse>('/api/store/customer', { method: 'GET' }, { auth: true });
  return mapProfileToUser(data.user || {});
}

export async function updateCustomerProfile(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  postcode: string;
  country: string;
  state: string;
  billingAddress: string;
  shippingAddress: string;
}): Promise<User> {
  const data = await apiFetch<CustomerProfileResponse>(
    '/api/store/customer',
    {
      method: 'PUT',
      body: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        billing: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          email: payload.email,
          phone: payload.phone,
          address_1: payload.billingAddress,
          city: payload.city,
          postcode: payload.postcode,
          country: payload.country,
          state: payload.state,
        },
        shipping: {
          first_name: payload.firstName,
          last_name: payload.lastName,
          address_1: payload.shippingAddress || payload.billingAddress,
          city: payload.city,
          postcode: payload.postcode,
          country: payload.country,
          state: payload.state,
        },
      },
    },
    { auth: true },
  );

  return mapProfileToUser(data.user || {});
}
