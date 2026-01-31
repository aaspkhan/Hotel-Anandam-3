
export interface FoodItem {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category: string;
  inStock?: boolean;
}

export interface CartItem extends FoodItem {
  quantity: number;
}

export type OrderStatus = 'Pending Acceptance' | 'Preparing' | 'Ready' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  created_at: string;
  user_email: string;
  phone: string;
  location: string;
  items: CartItem[];
  total_amount: number;
  status: OrderStatus;
  payment_method: 'COD' | 'GPay';
}

export type AppTab = 'home' | 'order' | 'tracking' | 'profile' | 'admin';

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}
