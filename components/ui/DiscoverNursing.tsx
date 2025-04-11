"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Product, ProductImage, CategoryProduct } from "@prisma/client";

const filters = [
  { id: "popular", label: "Popular Study Materials" },
  { id: "fundamentals", label: "Nursing Fundamentals" },
  { id: "med-surg", label: "Medical-Surgical" },
  { id: "pediatrics", label: "Pediatric Nursing" },
  { id: "mental", label: "Mental Health" }
];

interface DiscoverNursingProps {
  products: (Product & { 
    images: ProductImage[];
    categories: (CategoryProduct & {
      category: { slug: string }
    })[];
  })[];
}

const DiscoverNursing = ({ products }: DiscoverNursingProps) => {
  const [activeFilter, setActiveFilter] = useState("popular");

  const filteredProducts = activeFilter === "popular" 
    ? products 
    : products.filter(product => 
        product.categories.some(cat => cat.category.slug === activeFilter)
      );

  return (
    <div className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#1e2c51]">
            Discover Nursing Resources
          </h2>
          <div className="w-32 h-1 bg-[#5d8e9a] mx-auto mt-2 mb-8" />
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${filter.id === activeFilter
                  ? "bg-[#1e2c51] text-white" 
                  : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          layout
        >
          {filteredProducts.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-lg shadow-md overflow-hidden group"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative">
                  <div className="relative h-[200px]">
                    <Image
                      src={product.images[0]?.url || '/images/default-product.jpg'}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                    {product.featured && (
                      <div className="absolute top-4 left-4 bg-[#5d8e9a] text-white px-3 py-1 text-sm rounded-full">
                        FEATURED
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold text-lg text-[#1e2c51]">
                        {product.title}
                      </h3>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 text-yellow-400 fill-yellow-400`}
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {product.purchaseCount || 0} Students
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <div className="font-semibold text-[#1e2c51]">Lifetime</div>
                        <div className="text-gray-500">Access</div>
                      </div>
                      <div>
                        <div className="font-semibold text-[#1e2c51]">Complete</div>
                        <div className="text-gray-500">Package</div>
                      </div>
                      <div>
                        <div className="font-semibold text-[#1e2c51]">Full</div>
                        <div className="text-gray-500">Support</div>
                      </div>
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">Price</div>
                        <div>
                          <div className="text-lg font-bold text-[#1e2c51]">
                            ${Number(product.finalPrice).toFixed(2)}
                          </div>
                          {(product.discountPercent || 0) > 0 && (
                            <div className="text-xs text-gray-500 text-right line-through">
                              ${Number(product.price).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <div className="text-center mt-12">
          <button className="bg-[#ffd60a] hover:bg-yellow-400 text-[#1e2c51] font-semibold px-8 py-3 rounded-lg transition-colors">
            View More
          </button>
        </div>
      </div>
    </div>
  );
};

export default DiscoverNursing; 