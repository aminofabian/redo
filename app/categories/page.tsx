"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface CategoryStats {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  productCount: number;
  percentage: number;
  avgPrice: number;
  topSeller: {
    id: number;
    title: string;
    image: string;
    price: number;
    viewCount: number;
  } | null;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories/stats');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCategories(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">Categories</h1>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Categories</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link 
            href={`/categories/${category.slug}`} 
            key={category.id}
            className="block"
          >
            <div className="border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="h-48 bg-gray-200 relative">
                {category.topSeller?.image ? (
                  <img 
                    src={category.topSeller.image} 
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gray-100">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold">{category.name}</h2>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-gray-600">{category.productCount} products</p>
                  {category.avgPrice > 0 && (
                    <p className="text-gray-600">Avg: ${category.avgPrice.toFixed(2)}</p>
                  )}
                </div>
                {category.description && (
                  <p className="text-gray-500 text-sm mt-2 line-clamp-2">{category.description}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No categories found.</p>
        </div>
      )}
    </div>
  );
}

