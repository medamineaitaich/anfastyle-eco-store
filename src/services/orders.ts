import { apiFetch } from './http';

export interface AccountOrderItem {
  id: string;
  productId: string;
  variationId?: number;
  name: string;
  quantity: number;
  total: number;
  image: string;
  size: string;
  color: string;
}

export interface AccountOrder {
  id: string;
  status: string;
  date: string;
  total: number;
  currency: string;
  trackingNumber: string;
  totalRefunded: number;
  refundableAmount: number;
  canRefund: boolean;
  items: AccountOrderItem[];
}

interface OrdersResponse {
  orders?: AccountOrder[];
}

interface RefundResponse {
  order?: AccountOrder;
  message?: string;
}

export async function fetchCustomerOrders(): Promise<AccountOrder[]> {
  const data = await apiFetch<OrdersResponse>(
    '/api/store/orders?t=' + Date.now(),
    {
      method: 'GET',
      cache: 'no-store',
    },
    { auth: true, logoutOnUnauthorized: false },
  );

  return Array.isArray(data?.orders) ? data.orders : [];
}

export async function requestOrderRefund(payload: {
  orderId: string | number;
  reason?: string;
  amount?: number;
}): Promise<{ order: AccountOrder | null; message: string }> {
  const data = await apiFetch<RefundResponse>(
    '/api/store/orders',
    {
      method: 'POST',
      body: {
        orderId: payload.orderId,
        reason: payload.reason,
        amount: payload.amount,
      },
    },
    { auth: true },
  );

  return {
    order: data?.order || null,
    message: String(data?.message || 'Refund submitted successfully.'),
  };
}
