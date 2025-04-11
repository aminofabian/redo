import { Prisma } from '@prisma/client'

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

export interface CategoryStat {
  id: string;
  name: string;
  description: string | null;
  slug: string | null;
  productCount: number;
  percentage: number;
  avgPrice: number;
  topSeller: TopSeller | null;
}

export interface TopSeller {
  id: string;
  title: string;
  image: string;
  price: number;
  viewCount: number;
}

export type ProductWithImages = Prisma.ProductGetPayload<{
  include: { images: true }
}>

export type ProductImage = Prisma.ProductImageGetPayload<{}> 