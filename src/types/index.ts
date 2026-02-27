export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  colors?: string[];
  sizes?: string[];
}

export interface CartItem extends Product {
  color: string;
  size: string;
  quantity: number;
}

export interface User {
  firstName: string;
  lastName: string;
  email: string;
  address?: string;
}

export interface Order {
  id: string;
  date: string;
  status: string;
  trackingNumber: string;
  items: CartItem[];
  total: number;
}
