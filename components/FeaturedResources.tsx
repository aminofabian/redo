"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
  path?: string;
}

interface CategoryPath {
  path: string;
  level1: string | null;
  level2: string | null;
  level3: string | null;
}

interface ProductProps {
  id: number;
  title: string;
  slug: string;
  price: number;
  finalPrice: number;
  discountPercent?: number | null;
  imageUrl: string;
  primaryCategory: Category | null;
  categoryPaths: CategoryPath[];
}

interface FeaturedResourcesProps {
  products: ProductProps[];
}

export default function FeaturedResources({ products }: FeaturedResourcesProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Function to construct the category path URL
  const getCategoryUrl = (categoryPath: CategoryPath | null) => {
    if (!categoryPath) return '/categories';
    
    const parts = [categoryPath.level1, categoryPath.level2, categoryPath.level3]
      .filter(Boolean) // Remove nulls
      .map(slug => encodeURIComponent(String(slug)));
    
    return `/categories/${parts.join('/')}`;
  };

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Featured Resources</h2>
          <Link href="/products" passHref>
            <Button variant="outline" className="flex items-center gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => (
            <div 
              key={product.id}
              className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative h-48">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover transform transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {product.discountPercent && product.discountPercent > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      {product.discountPercent}% OFF
                    </div>
                  )}
                </div>
                <div className="p-4">
                  {product.primaryCategory && (
                    <Link 
                      href={`/categories/${product.primaryCategory.slug}`}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      {product.primaryCategory.name}
                    </Link>
                  )}
                  <h3 className="font-semibold text-lg mt-1 line-clamp-2">{product.title}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-lg font-bold text-gray-900">${product.finalPrice.toFixed(2)}</span>
                    {product.finalPrice < product.price && (
                      <span className="ml-2 text-sm text-gray-500 line-through">
                        ${product.price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 