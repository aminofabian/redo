export type ProductImage = {
  id: string;
  url: string;
  isPrimary: boolean;
};

export type ProductCategory = {
  category: {
    id: string;
    name: string;
    parentId?: string | null;
  };
};

export type ProductReview = {
  rating: number;
  user: {
    firstName: string | null;
    lastName: string | null;
    image: string | null;
  };
};

export type SerializableProduct = {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  price: number;
  finalPrice: number;
  discountPercent: number | null;
  discountAmount: number | null;
  accessDuration: number | null;
  downloadLimit: number | null;
  isPublished: boolean;
  featured: boolean;
  inStock?: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  images: ProductImage[];
  categories: ProductCategory[];
  reviews: ProductReview[];
};

export type Product = Omit<SerializableProduct, 'createdAt' | 'updatedAt' | 'price' | 'finalPrice' | 'discountAmount'> & {
  createdAt: Date;
  updatedAt: Date;
  price: { toNumber(): number };
  finalPrice: { toNumber(): number };
  discountAmount: { toNumber(): number } | null;
  reviews?: any[];
}; 