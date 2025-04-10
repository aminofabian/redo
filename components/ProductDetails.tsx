"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button"; 

export default function ProductDetails({ product }: { product: any }) {
  if (!product) return <div>Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {product.images && product.images[0] && (
            <div className="aspect-square relative rounded-md overflow-hidden">
              <Image 
                src={product.images[0].url} 
                alt={product.title} 
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-4">{product.title}</h1>
          <p className="text-gray-600 mb-6">{product.description}</p>
          <div className="mb-6">
            <p className="text-2xl font-bold">${Number(product.finalPrice).toFixed(2)}</p>
            {product.price !== product.finalPrice && (
              <p className="text-gray-500 line-through">${Number(product.price).toFixed(2)}</p>
            )}
          </div>
          <Button className="w-full mb-4">Add to Cart</Button>
        </div>
      </div>
    </div>
  );
} 