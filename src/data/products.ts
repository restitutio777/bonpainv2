import { Product } from '../types';

export const products: Product[] = [
  {
    id: 'baguette',
    name: 'Baguette',
    description: 'Croustillante, alvéolée, au levain naturel',
    price: 2.5,
    image: 'https://images.unsplash.com/photo-1465014925804-7b9ede58d0d7?w=600&q=80',
  },
  {
    id: 'pain_gris',
    name: 'Pain gris au levain',
    description: 'Farine semi-complète, mie tendre et goûteuse',
    price: 4.5,
    image: 'https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=600&q=80',
  },
  {
    id: 'pain_noix',
    name: 'Pain aux noix',
    description: 'Noix torréfiées, idéal avec du fromage',
    price: 5.5,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80',
  },
  {
    id: 'epeautre',
    name: 'Épeautre sésame',
    description: "Farine d'épeautre, sésame doré en croûte",
    price: 5.0,
    image: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600&q=80',
  },
  {
    id: 'bucheron',
    name: 'Pain bûcheron',
    description: 'Rustique, croûte épaisse, mie dense et parfumée',
    price: 5.0,
    image: 'https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=600&q=80',
  },
  {
    id: 'tarte',
    name: 'Tarte du jour',
    description: "Tarte salée ou sucrée, selon l'inspiration",
    price: 6.0,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80',
    badge: 'Selon saison',
  },
];

export const orderItems = [
  { id: 'baguette', name: 'Baguette', price: 2.5 },
  { id: 'pain_gris', name: 'Pain gris au levain', price: 4.5 },
  { id: 'pain_noix', name: 'Pain aux noix', price: 5.5 },
  { id: 'epeautre', name: 'Épeautre sésame', price: 5.0 },
  { id: 'bucheron', name: 'Pain bûcheron', price: 5.0 },
  { id: 'tarte', name: 'Tarte du jour', price: 6.0 },
  { id: 'croissant', name: 'Croissant', price: 1.8, saturdayOnly: true },
  { id: 'pain_chocolat', name: 'Pain au chocolat', price: 2.0, saturdayOnly: true },
];
