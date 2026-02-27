import { useState } from 'react';
import { User, Order } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const addOrder = (order: Order) => {
    setOrders([order, ...orders]);
  };

  return {
    user,
    setUser,
    orders,
    addOrder
  };
};
