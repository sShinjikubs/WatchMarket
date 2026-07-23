export interface User {
  username: string;
  password?: string;
  role: 'user' | 'manager' | 'admin';
}

export interface Profile {
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  address: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  brand: string;
  category: string;
  price: number;
  stock: number;
  color?: string;
  strokeColor?: string;
  isGoldFace?: boolean;
  image?: string;
  imageBack?: string;
  rating?: number;
  reviewCount?: number;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  email: string;
  address: string;
  payment: 'bank_transfer' | 'credit_card' | 'promptpay';
  status: string;
  date: string;
  slip?: string | null;
}

export interface PendingWatch {
  id: string;
  brand: string;
  model: string;
  price: number;
  proposedBanding: string;
  dialColor: string;
  description: string;
  sellerName: string;
  sellerEmail: string;
  inspectionStatus: 'pending' | 'passed' | 'failed';
  importStatus: 'pending' | 'imported';
  date: string;
}

export interface BlacklistEntry {
  email: string;
  nationalId: string;
  reason: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
}

export interface Review {
  id?: number;
  productId: string;
  username: string;
  rating: number;
  comment: string;
  date: string;
}

