export interface User {
  id: string;
  email: string;
  type: 'cliente' | 'esercente';
}

export interface Review {
  id: string;
  author: string;
  rating: number; // 1-5
  comment: string;
  authorImage: string;
}

export interface Product {
  id: string;
  name: string;
  images: string[];
  price: string;
  description: string;
}

export type Category = 'Ristoranti' | 'Negozi' | 'Bellezza' | 'Benessere' | 'Servizi';

export interface Coupon {
    id: string;
    code: string;
    description: string;
    type: 'percentage' | 'fixed' | 'conditional';
    value: number;
    minValue?: number; // Only for conditional
}


export interface Shop {
  id: string;
  ownerId: string; // email of the user
  name: string;
  cardImage: string;
  category: Category;
  description: string;
  longDescription: string;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  address: string;
  lat: number;
  lng: number;
  galleryImages: string[];
  products: Product[];
  reviews: Review[];
  coupons: Coupon[];
}