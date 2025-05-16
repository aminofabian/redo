'use client';

import Image from "next/image";
import { formatDistanceToNow } from 'date-fns';
import ProductImageGallery from './ProductImageGallery';
import { CartSidebarWithToaster, ProductInteractions } from './ClientComponents';
import type { Product, SerializableProduct } from "@/types/products";
import ReviewButton from './ReviewButton';
import ReviewVoteButtons from './ReviewVoteButtons';
import ReviewSection from './ReviewSection';

type RelatedProduct = Product;

type BaseProduct = {
  id: number;
  slug: string | null;
  categories?: { category: { id: string; name: string } }[];
};

function serializeProduct(product: any): SerializableProduct {
  return {
    ...product,
    price: typeof product.price === 'number' ? product.price : product.price?.toNumber() ?? 0,
    finalPrice: typeof product.finalPrice === 'number' ? product.finalPrice : product.finalPrice?.toNumber() ?? 0,
    discountAmount: typeof product.discountAmount === 'number' ? product.discountAmount : product.discountAmount?.toNumber() ?? null,
    createdAt: product.createdAt?.toISOString ? product.createdAt.toISOString() : product.createdAt ?? new Date().toISOString(),
    updatedAt: product.updatedAt?.toISOString ? product.updatedAt.toISOString() : product.updatedAt ?? new Date().toISOString(),
    images: product.images.map((img: any) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary
    })) ?? [],
    categories: product.categories?.map((cat: any) => ({
      category: {
        id: cat.category.id,
        name: cat.category.name,
        parentId: cat.category.parentId
      }
    })) ?? [],
    reviews: (product.reviews ?? []).map((review: any) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      userName: review.userName || 'Anonymous',
      helpfulCount: review.helpfulCount || 0,
      notHelpfulCount: review.notHelpfulCount || 0,
      status: review.status || 'pending',
      isGuest: review.isGuest || false,
      createdAt: review.createdAt?.toISOString ? review.createdAt.toISOString() : review.createdAt
    }))
  };
}

// Add this helper function that handles BigInt serialization
function customFetch(url: string, options = {}) {
  return fetch(url, options).then(async (res) => {
    if (!res.ok) return null;
    
    // Get the text response and parse it manually
    const text = await res.text();
    try {
      // Parse JSON with our custom reviver
      return JSON.parse(text, (key, value) => {
        // Handle any special cases here
        return value;
      });
    } catch (error) {
      console.error("Error parsing JSON response:", error);
      return null;
    }
  });
}

async function getProduct(slug: string) {
  try {
    // Sanitize the slug to prevent invalid URLs
    const sanitizedSlug = slug.replace(/[^a-zA-Z0-9-]/g, '');
    
    // Check if slug was corrupted with API responses
    if (sanitizedSlug.includes('apicategories') || 
        sanitizedSlug.includes('200in') ||
        sanitizedSlug.includes('404in') ||
        sanitizedSlug.length > 100) {
      console.error('Invalid product slug detected:', slug);
      return null;
    }
    
    console.log(`Fetching product with slug: ${sanitizedSlug}`);
    return await customFetch(`http://localhost:3000/api/products/slug/${sanitizedSlug}`);
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

async function getRelatedProducts(productId: number, categoryIds: string[]) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/products/related?id=${productId}&categories=${categoryIds.join(',')}`, 
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching related products:", error);
    return [];
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  // Server-side data fetching
  const product = await getProduct(params.slug);
  
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-xl shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-6">The product you're looking for could not be found or may have been removed.</p>
          <a 
            href="/products" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            ← Return to Products
          </a>
        </div>
      </div>
    );
  }
  
  const serializedProduct = serializeProduct(product);
  
  // Get category IDs for related products
  const categoryIds = serializedProduct.categories.map(c => c.category.id);
  const relatedProducts = await getRelatedProducts(serializedProduct.id, categoryIds);
  
  // Helper function for price formatting
  function formatPrice(price: any): string {
    return `$${Number(price).toFixed(2)}`;
  }
  
  // Calculate various display values
  const hasDiscount = (serializedProduct.discountAmount ?? 0) > 0 || (serializedProduct.discountPercent ?? 0) > 0;
  const originalPrice = serializedProduct.price ?? 0;
  const finalPrice = serializedProduct.finalPrice ?? 0;
  const discountAmount = serializedProduct.discountAmount ?? 0;
  const discountPercent = serializedProduct.discountPercent ?? Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
  const formattedPrice = formatPrice(serializedProduct.price);
  const formattedFinalPrice = formatPrice(serializedProduct.finalPrice);
  const createdAt = new Date(serializedProduct.createdAt);
  const updatedAt = new Date(serializedProduct.updatedAt);
  const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true });
  
  // Extract categories for easier referencing
  const categories = serializedProduct.categories.map(c => c.category);
  
  console.log("Product price data:", {
    price: serializedProduct.price,
    finalPrice: serializedProduct.finalPrice,
    discountAmount: serializedProduct.discountAmount,
    discountPercent: serializedProduct.discountPercent
  });
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Breadcrumb navigation */}
      <nav className="flex items-center text-sm text-gray-500 mb-6 hover:text-gray-700 transition-colors">
        <a href="/products" className="hover:underline">Products</a>
        <span className="mx-2">→</span>
        {categories.length > 0 && (
          <>
            <a href={`/products?category=${categories[0].id}`} className="hover:underline">{categories[0].name}</a>
            <span className="mx-2">→</span>
          </>
        )}
        <span className="text-gray-800 font-medium truncate">{serializedProduct.title}</span>
      </nav>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left column - Images and main product info */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold mb-4 tracking-tight text-gray-900">{serializedProduct.title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(category => (
                <a 
                  href={`/products?category=${category.id}`}
                  key={category.id} 
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-100 transition-colors"
                >
                  {category.name}
                </a>
              ))}
            </div>
            
            {/* More dominant product image section with subtle animations */}
            <div className="mb-10 transition-all duration-300 hover:translate-y-[-4px]">
              <div className="w-full rounded-xl overflow-hidden shadow-md">
                <ProductImageGallery 
                  images={serializedProduct.images || []} 
                  productTitle={serializedProduct.title} 
                />
              </div>
            </div>
            
            {/* Product info with improved layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative flex flex-col">
                <div className="mb-8">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-3xl font-bold text-gray-900">${finalPrice.toFixed(2)}</span>
                    {hasDiscount && (
                      <>
                        <span className="text-gray-500 line-through text-base">${originalPrice.toFixed(2)}</span>
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                          {discountPercent}% OFF
                        </span>
                      </>
                    )}
                  </div>
                  {hasDiscount && (
                    <div className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                      You save ${(originalPrice - finalPrice).toFixed(2)}
                    </div>
                  )}
                  {/* Monthly payment option removed */}
                </div>
                
                <div className="mb-8">
                  <div className="inline-flex items-center px-4 py-2 rounded-lg border-2 border-dashed border-gray-200">
                    <div className={`w-3 h-3 rounded-full mr-2 ${serializedProduct.inStock ? "bg-green-500" : "bg-red-500"}`}></div>
                    <p className={`font-medium ${serializedProduct.inStock ? "text-green-700" : "text-red-700"}`}>
                      {serializedProduct.inStock ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4 mt-auto pt-4 border-t border-gray-100">
                  <ProductInteractions product={serializedProduct} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Description with improved styling */}
          <div className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border hover:shadow-md transition-all">
            <h2 className="text-2xl font-bold mb-4 flex items-center"><span className="w-1.5 h-6 bg-blue-600 rounded-sm mr-3"></span>Description</h2>
            <div className="prose max-w-none">
              {serializedProduct.description ? (
                <p>{serializedProduct.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description available for this product.</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Right column - Product details */}
        <div>
          <div className="sticky top-24 space-y-6">
            <CartSidebarWithToaster 
              priceId={(serializedProduct.id || '').toString()}
              price={formattedFinalPrice}
              description={serializedProduct.title}
            />
            <div className="bg-white p-6 rounded-xl shadow-sm border mb-6 hover:shadow-md transition-all">
              <h2 className="text-xl font-bold mb-4 flex items-center"><span className="w-1.5 h-5 bg-indigo-600 rounded-sm mr-3"></span>Product Details</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-gray-500">Price</dt>
                  <dd className="text-xl font-bold">{formattedFinalPrice}</dd>
                  {hasDiscount && (
                    <dd className="text-sm">
                      <span className="text-gray-500 line-through">{formattedPrice}</span>
                      <span className="ml-2 text-green-600 font-medium">Save {discountPercent}%</span>
                    </dd>
                  )}
                </div>
                
                {serializedProduct.featured && (
                  <div>
                    <dt className="text-sm text-gray-500">Featured</dt>
                    <dd>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Featured Product
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          
            {/* Categories with improved styling */}
            {categories.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-all">
                <h2 className="text-xl font-bold mb-4 flex items-center"><span className="w-1.5 h-5 bg-green-600 rounded-sm mr-3"></span>Categories</h2>
                <div className="space-y-2">
                  {categories.map((category: { id: string; name: string; parentId?: string | null }) => (
                    <div key={category.id} className="p-3 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <span className="font-medium">{category.name}</span>
                      {category.parentId && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">Has parent</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16 bg-white p-8 rounded-xl shadow-sm border">
        <h2 className="text-2xl font-bold mb-8 flex items-center">
          <span className="w-2 h-7 bg-yellow-500 rounded-sm mr-3"></span>
          Customer Reviews
        </h2>

        {/* Overall rating summary */}
        <div className="flex items-center mb-8">
          <div className="mr-4">
            <span className="text-5xl font-bold text-gray-900">
              {calculateAverageRating(serializedProduct.reviews)}
            </span>
            <span className="text-xl text-gray-500">/5</span>
          </div>
          
          <div>
            <div className="flex text-yellow-400 text-2xl mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>
                  {parseFloat(calculateAverageRating(serializedProduct.reviews)) >= i + 1 
                    ? "★" 
                    : parseFloat(calculateAverageRating(serializedProduct.reviews)) > i 
                      ? "★" 
                      : "☆"}
                </span>
              ))}
            </div>
            <p className="text-gray-500">Based on {serializedProduct.reviews.filter(review => review.status === 'approved').length} approved reviews</p>
          </div>
          
          <div className="ml-auto">
            <ReviewButton 
              productId={serializedProduct.id} 
              productName={serializedProduct.title} 
            />
          </div>
        </div>
        
        {/* Reviews list */}
        <ReviewSection 
          reviews={serializedProduct.reviews} 
          productId={serializedProduct.id}
          productName={serializedProduct.title}
        />
      </div>
      
      {relatedProducts.length > 0 && (
        <div className="mt-16 bg-white p-8 rounded-xl shadow-sm border">
          <h2 className="text-2xl font-bold mb-8 flex items-center"><span className="w-2 h-7 bg-purple-600 rounded-sm mr-3"></span>Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct: SerializableProduct) => {
              const primaryImage = relatedProduct.images.find((img: { isPrimary: boolean; url: string }) => img.isPrimary) || relatedProduct.images[0];
              
              // Filter to only approved reviews before calculating average
              const approvedReviews = relatedProduct.reviews.filter(review => review.status === 'approved');
              const avgRating = approvedReviews.length > 0
                ? (approvedReviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / approvedReviews.length).toFixed(1)
                : "0.0";

              return (
                <a 
                  key={relatedProduct.id} 
                  href={`/products/${relatedProduct.slug}`}
                  className="group bg-white rounded-xl shadow-sm border hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative aspect-video">
                    <Image
                      src={primaryImage?.url || "/placeholder-image.jpg"}
                      alt={relatedProduct.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover rounded-t-lg"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {relatedProduct.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        ${Number(relatedProduct.finalPrice).toFixed(2)}
                      </span>
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="text-yellow-400">★</span>
                        <span className="ml-1">{avgRating}</span>
                        <span className="ml-1">({approvedReviews.length})</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function for date formatting
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

// Helper function for calculating average rating - only consider approved reviews
function calculateAverageRating(reviews: any[]): string {
  if (!reviews || reviews.length === 0) return "0.0";
  
  const approvedReviews = reviews.filter(review => review.status === 'approved');
  if (approvedReviews.length === 0) return "0.0";
  
  let total = 0;
  for (const review of approvedReviews) {
    total += review.rating || 0;
  }
  
  return (total / approvedReviews.length).toFixed(1);
}