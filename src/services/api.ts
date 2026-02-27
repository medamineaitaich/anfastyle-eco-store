import { User, Order } from '../types';

// Mock API service
export const api = {
  login: async (credentials: any): Promise<User> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          address: '123 Nature Way, Eco City, 90210'
        });
      }, 1500);
    });
  },

  register: async (userData: any): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1500);
    });
  },

  processOrder: async (orderData: any): Promise<Order> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new Error('Payment failed. Please check your card details and try again.'));
          return;
        }

        resolve({
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          date: new Date().toLocaleDateString(),
          status: 'Processing',
          trackingNumber: 'ANF' + Math.floor(Math.random() * 1000000000),
          items: orderData.items,
          total: orderData.total
        });
      }, 2000);
    });
  }
};
