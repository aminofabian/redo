import prisma from "@/lib/db";
import { Product } from '@/types/product';

let currentProductId = 0; // In a real app, this would come from your database

// Define an interface for the product data
interface ProductData {
  courseCode?: string;
  title: string;
  description?: string;
  price?: number;
  finalPrice?: number;
  discountPercent?: number;
  // Add other properties as needed
}

// Add this type definition
type ProductWithRelations = {
  images: any[];
  categories: any[];
  [key: string]: any;
}

export async function getAllProducts() {
  const products = await prisma.product.findMany({
    include: {
      images: true,
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  // Convert IDs to strings and add courseCode
  return products.map(product => ({
    ...product,
    id: String(product.id), // Convert numeric ID to string
    courseCode: product.categories[0]?.category.name || "course"
  }));
}

// Disable TypeScript for this specific function with triple-slash directive
// @ts-nocheck
export { getProductBySlug } from './productQueries';

/**
 * Extracts the product ID from a URL slug
 * @param slug The product slug (format: "product-name-id")
 * @returns The extracted ID
 */
export function extractIdFromSlug(slug: string): string {
  // Extract the ID which is expected to be at the end of the slug after the last dash
  const parts = slug.split('-');
  return parts[parts.length - 1];
}

export async function createProduct(productData: ProductData) {
  // Get the next sequential ID
  currentProductId++;
  
  // Format the course code and title for the slug
  const courseCode = productData.courseCode || "course";
  const title = productData.title.toLowerCase().replace(/\s+/g, '-');
  
  // Create the product with sequential ID as a number
  const product = {
    ...productData,
    id: currentProductId,  // Use numeric ID for database
    slug: `${courseCode.toLowerCase()}-${title}-${currentProductId}`
  };
  
  // Save to database...
  
  // Return with string ID for frontend
  return {
    ...product,
    id: String(product.id)  // Convert ID to string for frontend
  };
}

function calculateAverageRating(reviews: any[]) {
  if (reviews.length === 0) return "0.0";
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}

export function generateProductSlug(product: any): string {
  // Clean up the title for URL use
  const cleanTitle = product.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
    .trim();
  
  // Create a simple slug with just title and ID
  return `${cleanTitle}-${String(product.id)}`;
} 