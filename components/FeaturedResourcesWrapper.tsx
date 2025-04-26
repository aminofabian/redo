"use client";

import { useEffect, useState } from "react";
import FeaturedResources from "./FeaturedResources";
import { getFeaturedProducts } from "@/app/actions/productActions";

// Define the type for product items
interface ProductItem {
  id: number;
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
  } | null;
  categoryPaths: { path: string; level1: string | null; level2: string | null; level3: string | null; }[];
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
  
  return <FeaturedResources products={products} />;
} 