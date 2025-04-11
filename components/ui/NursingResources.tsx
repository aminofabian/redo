import { motion } from "framer-motion";
import { ArrowRight, Clock, MapPin, Users, BookOpen, Star } from "lucide-react";
import { Button } from "./button";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/db";
import { Product, ProductImage } from "@prisma/client";

// Update the Resource type to match our database structure
type Resource = {
  id: string;
  slug: string;
  title: string;
  location?: string;
  originalPrice: number;
  price: number;
  discountPercent?: number;
  image: string;
  questions?: string;
  students?: string;
  rating: string;
  reviews: number;
  lastUpdated?: string;
  duration?: string;
  tags: string[];
};

// Remove the data fetching from this component
const NursingproductsSection = ({ 
  products 
}: { 
  products: (Product & { images: ProductImage[] })[] 
}) => {
  if (!products || products.length === 0) {
    return (
      <div className="bg-[#fdfbf7] py-16 text-center">
        <h2>No products available</h2>
      </div>
    );
  }

  // Transform the database products to match our Resource type
  const transformedProducts: Resource[] = products.map((product: Product & { images: ProductImage[] }) => {
    // Calculate final price based on discount type
    const originalPrice = Number(product.price);
    let finalPrice = Number(product.finalPrice); // Use the finalPrice field from DB

    return {
      id: product.id.toString(),
      slug: product.slug,
      title: product.title,
      originalPrice: originalPrice,
      price: finalPrice,
      discountPercent: product.discountPercent || 0,
      image: product.images.find(img => img.isPrimary)?.url || product.images[0]?.url || '/images/default-product.jpg',
      rating: "4.5",
      reviews: 0,
      lastUpdated: product.updatedAt?.toLocaleDateString(),
      tags: ["Nursing Resource"],
      duration: "Lifetime Access",
      questions: "Study Material",
      students: "0+ Students"
    };
  });

  return (
    <div className="bg-[#fdfbf7] py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-[#1e2c51]">
            Best Packages to Complete Your
          </h2>
          <h3 className="text-2xl md:text-3xl text-[#1e2c51] mt-2">
            Nursing Program
          </h3>
          <p className="mt-4 text-gray-600">
            Choose from the best study materials to make your education complete with unforgettable experiences and savings!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {transformedProducts.map((resource, index) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-3xl shadow-md overflow-hidden group"
            >
              <div className="relative h-48">
                <Image
                  src={resource.image}
                  alt={resource.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {resource.discountPercent && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Save {resource.discountPercent}%
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-[#5d8e9a] text-white px-4 py-1 rounded-full text-sm">
                  ${resource.price.toFixed(2)}
                </div>
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-lg text-[#1e2c51] flex-1">
                    {resource.title}
                  </h3>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-medium">{resource.rating}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{resource.tags[0] || "Nursing Resource"}</span>
                </div>

                <div className="flex items-center space-x-2 text-gray-500 text-sm mt-2">
                  <Clock className="w-4 h-4" />
                  <span>{resource.duration || "Lifetime Access"}</span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <BookOpen className="w-4 h-4" />
                      <span>{resource.questions || "Study Material"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{resource.students || `${resource.reviews}+ Reviews`}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500 line-through">
                        ${resource.originalPrice.toFixed(2)}
                      </span>
                      <span className="ml-2 text-lg font-bold text-[#1e2c51]">
                        ${resource.price.toFixed(2)}
                      </span>
                    </div>
                    <Link href={`/products/${resource.slug}`}>
                      <button className="bg-[#5d8e9a] hover:bg-[#537f8a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        View Details
                      </button>
                    </Link>
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    {resource.lastUpdated || "Recently updated"}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/products">
            <button className="bg-[#ffd60a] hover:bg-yellow-400 text-[#1e2c51] font-semibold px-8 py-3 rounded-lg transition-colors">
              View More
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NursingproductsSection; 