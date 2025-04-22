"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  finalPrice: number;
  viewCount: number;
  images: Array<{
    url: string;
    isPrimary: boolean;
  }>;
}

interface CategoryDetail {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  productCount: number;
  products: Product[];
}

export default function CategoryDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [category, setCategory] = useState<CategoryDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        const response = await fetch(`/api/categories/${slug}`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: Failed to load category`);
        }
        
        const data = await response.json();
        setCategory(data);
      } catch (error) {
        console.error("Failed to fetch category details:", error);
        setError(error instanceof Error ? error.message : "Failed to load category");
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchCategoryDetails();
    }
  }, [slug]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading category...</p>
        </div>
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
          <p className="text-gray-700">{error || "Category not found"}</p>
          <Link href="/categories" className="inline-block mt-4 text-blue-600 hover:underline">
            Return to categories
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <Link href="/categories" className="text-blue-600 hover:underline mb-2 inline-block">
          ← Back to Categories
        </Link>
        <h1 className="text-3xl font-bold">{category.name}</h1>
        {category.description && (
          <p className="text-gray-700 mt-2">{category.description}</p>
        )}
        <p className="text-gray-600 mt-1">{category.productCount} products</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {category.products.map((product) => {
          const primaryImage = product.images.find(img => img.isPrimary)?.url || 
                              product.images[0]?.url || 
                              "/placeholder-image.jpg";
          
          return (
            <Link href={`/products/${product.slug}`} key={product.id} className="group">
              <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="h-48 bg-gray-200 relative">
                  <Image 
                    src={primaryImage}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-medium group-hover:text-blue-600 transition-colors">
                    {product.title}
                  </h2>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-gray-900 font-semibold">${product.finalPrice.toFixed(2)}</p>
                    <p className="text-gray-500 text-sm">{product.viewCount} views</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {category.products.length === 0 && (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <p className="text-gray-500">No products found in this category.</p>
        </div>
      )}
    </div>
  );
} 