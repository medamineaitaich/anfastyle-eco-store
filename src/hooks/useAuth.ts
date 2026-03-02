import { useEffect, useMemo, useState } from 'react';
import { User, Order } from '../types';

const USER_STORAGE_KEY = 'anfauth:user';
const ORDERS_STORAGE_PREFIX = 'anfauth:orders:';

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getUserStorageKey(user: User | null) {
  if (!user) return null;
  if (user.id !== undefined && user.id !== null && String(user.id).trim()) {
    return `id:${String(user.id).trim()}`;
  }
  const email = String(user.email || '').trim().toLowerCase();
  if (email) return `email:${email}`;
  return null;
}

function loadStoredUser() {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function loadStoredOrders(userStorageKey: string | null) {
  if (!isBrowser() || !userStorageKey) return [];
  try {
    const raw = window.localStorage.getItem(`${ORDERS_STORAGE_PREFIX}${userStorageKey}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => loadStoredUser());
  const userStorageKey = useMemo(() => getUserStorageKey(user), [user]);
  const [orders, setOrders] = useState<Order[]>(() => loadStoredOrders(getUserStorageKey(loadStoredUser())));

  useEffect(() => {
    if (!isBrowser()) return;
    if (!user) {
      window.localStorage.removeItem(USER_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    setOrders(loadStoredOrders(userStorageKey));
  }, [userStorageKey]);

  useEffect(() => {
    if (!isBrowser() || !userStorageKey) return;
    window.localStorage.setItem(`${ORDERS_STORAGE_PREFIX}${userStorageKey}`, JSON.stringify(orders));
  }, [orders, userStorageKey]);

  const addOrder = (order: Order) => {
    setOrders((prevOrders) => [order, ...prevOrders]);
  };

  return {
    user,
    setUser,
    orders,
    addOrder
  };
};
