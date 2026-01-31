
import { FoodItem } from './types';

export const FOOD_ITEMS: FoodItem[] = [
  {
    id: '1',
    name: 'Chicken Rice',
    price: 180,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80',
    description: 'Flavorful basmati rice cooked with tender chicken pieces.',
    category: 'Rice',
    inStock: true
  },
  {
    id: '2',
    name: 'Chicken Noodles',
    price: 160,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&q=80',
    description: 'Stir-fried noodles with succulent chicken and fresh veggies.',
    category: 'Noodles',
    inStock: true
  },
  {
    id: '3',
    name: 'Egg Rice',
    price: 140,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=400&q=80',
    description: 'A comforting mix of scrambled eggs and rice.',
    category: 'Rice',
    inStock: true
  },
  {
    id: '4',
    name: 'Egg Noodles',
    price: 130,
    image: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=400&q=80',
    description: 'Savory noodles tossed with scrambled eggs.',
    category: 'Noodles',
    inStock: true
  },
  {
    id: '5',
    name: 'Parotta (2pcs)',
    price: 45,
    image: 'https://images.unsplash.com/photo-1613292443284-8d8595c57384?auto=format&fit=crop&w=800&q=80',
    description: 'Layered, flaky, and crispy traditional Indian flatbread.',
    category: 'Breads',
    inStock: true
  },
  {
    id: '6',
    name: 'Kothu Parotta',
    price: 150,
    image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
    description: 'Minced parotta stir-fried with eggs and spicy salna.',
    category: 'Specials',
    inStock: true
  },
  {
    id: '7',
    name: 'Chilli Parotta',
    price: 145,
    image: 'https://images.unsplash.com/photo-1541014741259-de529411b96a?auto=format&fit=crop&w=400&q=80',
    description: 'Crispy parotta pieces sautéed with chillies and sauces.',
    category: 'Specials',
    inStock: true
  },
  {
    id: '8',
    name: 'Coca Cola',
    price: 40,
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
    description: '',
    category: 'Drinks',
    inStock: true
  }
];

export const MOCK_USER = {
  name: 'Anand Kumar',
  email: 'anand@example.com',
  phone: '+91 98765 43210',
  address: 'No. 42, Temple View Street, Madurai, TN',
  avatar: 'https://i.pravatar.cc/150?u=anand'
};
