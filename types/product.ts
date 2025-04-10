// Create this file to hold your product types
export interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: any; // Use specific type from Prisma if available
  discountAmount: any | null;
  discountPercent: number | null;
  discountType: string | null;
  images: ProductImage[];
  categories: ProductCategory[];
  createdById: string;
  // Add other fields as needed
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
  productId: string;
  createdAt: Date;
}

export interface ProductCategory {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }
} 