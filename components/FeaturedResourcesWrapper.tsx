"use client";

import { useEffect, useState } from "react";
import FeaturedResources from "./FeaturedResources";
import { getFeaturedProducts } from "@/app/actions/productActions";

// Define the type for product items
interface ProductItem {
  id: bigint;
  title: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent: number | null;
  imageUrl: string;
  primaryCategory: {
    id: string;
    name: string;
    slug: string;
    path: string;
  } | null;
  categoryPaths: any[];
}

export default function FeaturedResourcesWrapper() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const featuredProducts = await getFeaturedProducts();
      setProducts(featuredProducts);
      setLoading(false);
    }
    
    loadProducts();
  }, []);

  if (loading) return <div>Loading featured resources...</div>;
  
  // Convert bigint ids to numbers before passing to FeaturedResources
  const productsWithNumberIds = products.map(product => ({
    ...product,
    id: Number(product.id)
  }));
  
  return <FeaturedResources products={productsWithNumberIds} />;
} 