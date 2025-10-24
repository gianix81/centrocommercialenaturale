import type { Shop, Category } from './types';

export const CATEGORIES: { name: Category; icon: string }[] = [
  { name: 'Ristoranti', icon: 'Restaurant' },
  { name: 'Negozi', icon: 'Shop' },
  { name: 'Bellezza', icon: 'Beauty' },
  { name: 'Benessere', icon: 'Wellness' },
  { name: 'Servizi', icon: 'Services' },
];

export const SHOPS: Shop[] = [];