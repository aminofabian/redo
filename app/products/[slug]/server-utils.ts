import { getProductBySlug, getAllProducts, generateProductSlug } from "../../../lib/products";
import prisma from "../../../lib/db";
import type { Metadata } from "next";
import type { Product, SerializableProduct } from "@/types/products";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  // Your existing metadata function
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({
    slug: generateProductSlug(product),
  }));
}

export async function getRelatedProducts(productId: number, categoryIds: string[], limit = 4): Promise<SerializableProduct[]> {
  // Your existing related products function
} 