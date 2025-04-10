export interface Product {
  id: string;
  slug: string;
  title: string;
  originalPrice: number;
  price: number;
  discountPercent?: number;
  image: string;
  questions?: string;
  students: string;
  rating: string;
  reviews: number;
  lastUpdated: string;
  duration: string;
  tags: string[];
} 