import Image from "next/image";
import { formatDistanceToNow } from 'date-fns';
import ProductImageGallery from './ProductImageGallery';
import { CartSidebarWithToaster, ProductInteractions } from './ClientComponents';
import type { Product, SerializableProduct } from "@/types/products";

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
    reviews: product.reviews ?? [] // Default to empty array when reviews don't exist
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
    // Use our custom fetch function
    return await customFetch(`http://localhost:3000/api/products/slug/${slug}`);
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
    return <div>Product not found</div>;
  }
  
  const serializedProduct = serializeProduct(product);
  
  // Get category IDs for related products
  const categoryIds = serializedProduct.categories.map(c => c.category.id);
  const relatedProducts = await getRelatedProducts(serializedProduct.id, categoryIds);
  
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
  
  // Get categories from the product
  const categories = serializedProduct.categories.map(c => c.category);
  
  console.log("Product price data:", {
    price: serializedProduct.price,
    finalPrice: serializedProduct.finalPrice,
    discountAmount: serializedProduct.discountAmount,
    discountPercent: serializedProduct.discountPercent
  });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Images and main product info */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h1 className="text-3xl font-bold mb-4">{serializedProduct.title}</h1>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(category => (
                <span key={category.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {category.name}
                </span>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Replace the old image component with the new gallery */}
              <div>
                <ProductImageGallery 
                  images={serializedProduct.images || []} 
                  productTitle={serializedProduct.title} 
                />
              </div>
              
              {/* Product info */}
              <div className="relative">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-2xl font-bold">${finalPrice.toFixed(2)}</span>
                    {hasDiscount && (
                      <>
                        <span className="text-gray-500 line-through text-sm">${originalPrice.toFixed(2)}</span>
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                          Save {discountPercent}%
                        </span>
                      </>
                    )}
                  </div>
                  {hasDiscount && (
                    <div className="text-sm text-green-600 font-medium">
                      You save ${(originalPrice - finalPrice).toFixed(2)}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 mt-1">
                    or ${(finalPrice / 3).toFixed(2)}/mo
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Access Duration</h3>
                    <p>{serializedProduct.accessDuration ? `${serializedProduct.accessDuration} days` : "Unlimited"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Download Limit</h3>
                    <p>{serializedProduct.downloadLimit ? `${serializedProduct.downloadLimit} downloads` : "Unlimited"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Availability</h3>
                    <p className={serializedProduct.inStock ? "text-green-600" : "text-red-600"}>
                      {serializedProduct.inStock ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <ProductInteractions product={serializedProduct} />
                </div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Description</h2>
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
          <CartSidebarWithToaster 
            priceId={(serializedProduct.id || '').toString()}
            price={formattedFinalPrice}
            description={serializedProduct.title}
          />
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h2 className="text-xl font-bold mb-4">Product Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd>{formatDate(createdAt)}</dd>
              </div>
              
              <div>
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd>{formatDate(updatedAt)}</dd>
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
          
          {/* Categories */}
          {categories.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map((category: { id: string; name: string; parentId?: string | null }) => (
                  <div key={category.id} className="p-3 border rounded flex justify-between items-center">
                    <span>{category.name}</span>
                    {category.parentId && (
                      <span className="text-xs text-gray-500">Has parent</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {relatedProducts.length > 0 && (
        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct: SerializableProduct) => {
              const primaryImage = relatedProduct.images.find((img: { isPrimary: boolean; url: string }) => img.isPrimary) || relatedProduct.images[0];
              const avgRating = relatedProduct.reviews.length > 0
                ? (relatedProduct.reviews.reduce((sum: number, review: { rating: number }) => sum + review.rating, 0) / relatedProduct.reviews.length).toFixed(1)
                : "0.0";

              return (
                <a 
                  key={relatedProduct.id} 
                  href={`/products/${relatedProduct.slug}`}
                  className="group bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
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
                        <span className="ml-1">({relatedProduct.reviews.length})</span>
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
      {/* Toaster moved to CartSidebarWithToaster client component */}
    </div>
  );
}

// Helper functions
function formatPrice(price: any): string {
  return `$${Number(price).toFixed(2)}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function calculateAverageRating(reviews: any[]) {
  if (reviews.length === 0) return "0.0";
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return (total / reviews.length).toFixed(1);
}