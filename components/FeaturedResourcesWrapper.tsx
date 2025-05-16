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

// Skeleton loading component for resources
const ResourceSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, index) => (
        <div key={index} className="bg-gray-100 rounded-lg p-4 animate-pulse">
          <div className="w-full h-48 bg-gray-200 rounded-md mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="flex justify-between items-center">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

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

  if (loading) return <ResourceSkeleton />;
  
  // Convert bigint ids to numbers before passing to FeaturedResources
  const productsWithNumberIds = products.map(product => ({
    ...product,
    id: Number(product.id)
  }));
  
  return <FeaturedResources products={productsWithNumberIds} />;
} 