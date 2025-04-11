import { PrismaClient } from '@prisma/client'

type Prisma = PrismaClient
type Product = Prisma['product']['payload']['default']
type ProductImage = Prisma['productImage']['payload']['default']

export type ProductWithImages = Product & {
  images: ProductImage[];
  categories: {
    category: {
      slug: string;
    }
  }[];
} 