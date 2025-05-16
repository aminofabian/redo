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

interface FeatuorangeResourcesProps {
  products: ProductProps[];
}

export default function FeatuorangeResources({ products }: FeatuorangeResourcesProps) {
  const [hoveorangeIndex, setHoveorangeIndex] = useState<number | null>(null);

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
          {/* <h2 className="text-3xl font-bold text-gray-900">Featuorange Resources</h2> */}
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
              className="bg-white border-t border-l border-r border-green-500 overflow-hidden transition-all duration-200 hover:shadow-lg group"
              onMouseEnter={() => setHoveorangeIndex(index)}
              onMouseLeave={() => setHoveorangeIndex(null)}
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute z-10 top-0 left-0 w-full h-full bg-gradient-to-b from-black/0 to-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover transform transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {product.discountPercent && product.discountPercent > 0 && (
                    <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 z-20">
                      {product.discountPercent}% OFF
                    </div>
                  )}
                </div>
                <div className="p-4 border-b border-green-600 relative">
                  <div className="absolute -top-6 right-0 w-12 h-12 bg-green-500 transform rotate-45 translate-x-6 -translate-y-6 z-0"></div>
                  {product.primaryCategory && (
                    <Link 
                      href={`/categories/${product.primaryCategory.slug}`}
                      className="text-xs font-medium text-blue-600 hover:underline relative z-10"
                    >
                      {product.primaryCategory.name}
                    </Link>
                  )}
                  <div className="mt-1.5 bg-gradient-to-r from-white to-gray-50 p-3.5 hover:shadow transition-all duration-300 relative overflow-hidden border-l border-green-500">
                    <div className="absolute top-0 left-0 w-1 h-0 bg-green-500 group-hover:h-full transition-all duration-500"></div>
                    <h3 className="font-medium text-base line-clamp-2 tracking-tight text-gray-700 pl-2 relative z-10">{product.title}</h3>
                    <div className="mt-2 flex items-baseline justify-between pl-2">
                      <div>
                        <span className="text-base font-semibold text-green-600">${product.finalPrice.toFixed(2)}</span>
                        {product.finalPrice < product.price && (
                          <span className="ml-2 text-xs text-gray-500 line-through">
                            ${product.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button 
                        className="text-xs px-3 py-1.5 bg-green-50 text-green-600 border-l border-t border-b border-green-200 font-medium hover:bg-green-100 hover:text-green-700 transition-colors relative z-10 after:content-[''] after:absolute after:h-0 after:w-full after:bg-green-200/30 after:left-0 after:bottom-0 after:transition-all hover:after:h-full after:z-[-1]"
                      >
                        View Details
                      </button>
                    </div>
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