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

export type Product = {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  price: { toNumber(): number };
  finalPrice: { toNumber(): number };
  discountPercent: number | null;
  discountAmount: { toNumber(): number } | null;
  accessDuration: number | null;
  downloadLimit: number | null;
  isPublished: boolean;
  featured: boolean;
  inStock?: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  images: ProductImage[];
  categories: ProductCategory[];
  reviews: ProductReview[];
}; 