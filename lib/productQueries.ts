// @ts-nocheck
import prisma from "@/lib/db";
import { extractIdFromSlug } from "./products";

export async function getProductBySlug(slug: string) {
  try {
    const decodedSlug = decodeURIComponent(slug);
    
    const includeOptions = {
      images: true,
      categories: {
        include: {
          category: true
        }
      }
    };

    // First try direct lookup
    let product = await prisma.product.findUnique({
      where: { slug: decodedSlug },
      include: includeOptions
    });
    
    if (product) {
      product.images = product.images || [];
      product.categories = product.categories || [];
      return product;
    }
    
    // Try ID lookup
    const productId = extractIdFromSlug(decodedSlug);
    if (productId) {
      product = await prisma.product.findUnique({
        where: { id: parseInt(productId) },
        include: includeOptions
      });
      
      if (product) {
        product.images = product.images || [];
        product.categories = product.categories || [];
        return product;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding product:', error);
    return null;
  }
} 