// Example React component to display purchased products
"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  path: string;
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

interface Product {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  finalPrice: number;
  downloadUrl: string | null;
  accessDuration: number | null;
  downloadLimit: number | null;
  primaryImage: ProductImage | null;
  categories: Category[];
}

interface PurchasedProduct {
  purchaseId: string;
  purchaseDate: string;
  purchaseAmount: number;
  purchaseStatus: string;
  accessExpires: string | null;
  downloadsLeft: number | null;
  product: Product;
}

export default function PurchasedProducts() {
  const [products, setProducts] = useState<PurchasedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchasedProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/order/materials');
        
        if (!response.ok) {
          throw new Error('Failed to fetch purchased products');
        }
        
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedProducts();
  }, []);

  if (loading) {
    return <div>Loading your purchased products...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (products.length === 0) {
    return <div>You haven't purchased any products yet.</div>;
  }

  return (
    <div className="purchased-products">
      <h2 className="text-2xl font-bold mb-6">Your Purchased Products</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((item) => (
          <div key={item.purchaseId} className="border rounded-lg overflow-hidden shadow-md">
            {/* Product Image */}
            <div className="h-48 relative bg-gray-100">
              {item.product.primaryImage ? (
                <Image
                  src={item.product.primaryImage.url}
                  alt={item.product.primaryImage.alt || item.product.title}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{item.product.title}</h3>
              
              {/* Categories */}
              <div className="mb-2 flex flex-wrap gap-1">
                {item.product.categories.map((category) => (
                  <span 
                    key={category.id} 
                    className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
              
              {/* Purchase Details */}
              <div className="text-sm text-gray-600 mt-3">
                <p>Purchased: {new Date(item.purchaseDate).toLocaleDateString()}</p>
                <p>Price: ${item.purchaseAmount}</p>
                
                {item.accessExpires && (
                  <p>
                    Access expires: {new Date(item.accessExpires).toLocaleDateString()}
                  </p>
                )}
                
                {item.downloadsLeft !== null && (
                  <p>Downloads remaining: {item.downloadsLeft}</p>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="mt-4 flex gap-2">
                {item.product.downloadUrl && (
                  <a 
                    href={item.product.downloadUrl} 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    download
                  >
                    Download
                  </a>
                )}
                
                <Link 
                  href={`/products/${item.product.slug}`}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}