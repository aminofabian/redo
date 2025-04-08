"use client";

import { useState } from "react";
import { Star, BookOpen, Clock, Users, ChevronLeft, ChevronRight, Heart, Share2, ChevronRight as ChevronRightIcon, Shield, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

type ProductProps = {
  product: {
    id: string;
    slug: string;
    title: string;
    description: string;
    price: number;
    finalPrice: number;
    discountPercent?: number;
    hasDiscount: boolean;
    monthlyPrice: number;
    rating: string;
    reviews: number;
    type: string;
    duration: string;
    tags: string[];
    images: string[];
    questions?: string;
    chapters?: string;
    downloadLimit?: number;
    featured: boolean;
    viewCount: number;
  }
};

export default function ProductDetails({ product }: ProductProps) {
  const [selectedImage, setSelectedImage] = useState(0);

  const features = [
    { icon: BookOpen, title: "Study Material", description: product.type === "Practice Tests" ? `${product.questions}` : `${product.chapters || "15+ Chapters"}` },
    { icon: Clock, title: "Duration", description: product.duration },
    { icon: Users, title: "Expert Support", description: "24/7 instructor assistance" },
    { icon: Star, title: "Certificate", description: "Course completion certificate" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm mb-6">
        <Link href="/" className="text-muted-foreground hover:text-primary">Home</Link>
        <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
        <Link href="/resources" className="text-muted-foreground hover:text-primary">Resources</Link>
        <ChevronRightIcon className="w-4 h-4 text-muted-foreground" />
        <span className="text-primary truncate">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="rounded-lg overflow-hidden border mb-4 aspect-video bg-gray-100">
            <img 
              src={product.images[selectedImage] || '/placeholder-image.jpg'} 
              alt={product.title}
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="relative">
              <div className="flex space-x-2 overflow-x-auto py-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.title} thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              
              {product.images.length > 4 && (
                <>
                  <button 
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto');
                      if (container) container.scrollLeft -= 100;
                    }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-white rounded-full p-1 shadow-md"
                    onClick={() => {
                      const container = document.querySelector('.overflow-x-auto');
                      if (container) container.scrollLeft += 100;
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{product.title}</h1>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium ml-1">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">
                  ({product.reviews} reviews)
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="p-2 rounded-full border hover:bg-gray-50">
                <Heart className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-full border hover:bg-gray-50">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Pricing */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="mb-3">
              {product.hasDiscount ? (
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-primary">${product.finalPrice.toFixed(2)}</span>
                  <span className="text-lg text-muted-foreground line-through">${product.price.toFixed(2)}</span>
                  {product.discountPercent && (
                    <span className="bg-green-100 text-green-800 text-sm px-2 py-1 rounded-full">
                      Save {product.discountPercent}%
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-3xl font-bold">${product.price.toFixed(2)}</span>
              )}
              <div className="text-sm text-muted-foreground mt-1">
                or ${product.monthlyPrice}/month with payment plan
              </div>
            </div>
            
            <Button className="w-full">Add to Cart</Button>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Star className="w-4 h-4 text-primary" />
                  </div>
                  <span>Trusted by over 10,000 nursing students</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <span>Instant digital delivery</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="w-4 h-4 text-primary" />
                  </div>
                  <span>Used by 50,000+ nursing students</span>
                </div>
              </div>
            </div>

            {/* Add a trust banner */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4" />
                  <span>30-Day Money Back</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  <span>Instant Download</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description and Details */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Description</h2>
        <div className="prose max-w-none">
          {product.description ? (
            <div dangerouslySetInnerHTML={{ __html: product.description }} />
          ) : (
            <p className="text-muted-foreground">No description available.</p>
          )}
        </div>
        
        {/* Product features/specs */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="p-2 bg-primary/10 rounded-full">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Tags/Categories */}
        {product.tags && product.tags.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map(tag => (
                <span 
                  key={tag}
                  className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Additional product details */}
        <div className="mt-6 space-y-3 text-sm">
          {product.downloadLimit && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Download Limit:</span>
              <span className="font-medium">{product.downloadLimit} downloads</span>
            </div>
          )}
          
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Format:</span>
            <span className="font-medium">Digital Download (PDF)</span>
          </div>
          
          <div className="flex justify-between border-b pb-2">
            <span className="text-muted-foreground">Access Duration:</span>
            <span className="font-medium">{product.duration}</span>
          </div>
          
          {product.viewCount > 0 && (
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Views:</span>
              <span className="font-medium">{product.viewCount} people viewed this resource</span>
            </div>
          )}
          
          <div className="flex justify-between pb-2">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-medium">{product.type}</span>
          </div>
        </div>
      </div>
    </div>
  );
} 