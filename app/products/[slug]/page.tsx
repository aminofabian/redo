'use client';

// Add this at the top level to make the route dynamic 
// (this is a special export recognized by Next.js)
export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import prisma from "../../../lib/db";
import { getProductBySlug, getAllProducts, generateProductSlug } from "../../../lib/products";
import Image from "next/image";
import { formatDistanceToNow } from 'date-fns';
import ProductImageGallery from './ProductImageGallery';
import PackageSelector from './PackageSelector';
import { CartSidebar } from "@/components/ui/CartSidebar";
import { Toaster } from "sonner";
import { AddToPackageButton } from './AddToPackageButton';
import type { Product, SerializableProduct } from "@/types/products";

type RelatedProduct = Product;

type BaseProduct = {
  id: number;
  slug: string | null;
  categories?: { category: { id: string; name: string } }[];
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  console.log('Fetching metadata for slug:', params.slug);
  
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      images: true,
      categories: {
        include: {
          category: true
        }
      }
    }
  });
  
  console.log('Product found:', product ? 'yes' : 'no', product?.id);
  
  if (!product) {
    console.log('Product not found for slug:', params.slug);
    return {
      title: "Resource Not Found | RN Student Resources",
      description: "The requested resource could not be found.",
      robots: "noindex"
    };
  }

  const price = product.finalPrice.toNumber();
  const categories = product.categories.map((c: { category: { name: string } }) => c.category.name).join(", ");
  
  return {
    title: `${product.title} | RN Student Resources`,
    description: product.description || `Get ${product.title} for ${formatPrice(price)}. Access study materials and resources for nursing students.`,
    keywords: [`nursing resources`, `study materials`, categories, product.title].filter(Boolean).join(", "),
    openGraph: {
      title: product.title,
      description: product.description || `Get ${product.title} for ${formatPrice(price)}`,
      type: "website",
      images: product.images?.length ? [
        {
          url: product.images[0].url,
          width: 1200,
          height: 630,
          alt: product.title
        }
      ] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description || `Get ${product.title} for ${formatPrice(price)}`,
      images: product.images?.length ? [product.images[0].url] : undefined,
    },
    alternates: {
      canonical: `/products/${product.slug}`
    }
  };
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((product) => ({
    slug: generateProductSlug(product),
  }));
}

async function getRelatedProducts(productId: number, categoryIds: string[], limit = 4): Promise<SerializableProduct[]> {
  const products = await prisma.product.findMany({
    where: {
      AND: [
        { isPublished: true },
        { id: { not: productId } },
        {
          categories: {
            some: {
              categoryId: {
                in: categoryIds
              }
            }
          }
        }
      ]
    },
    include: {
      images: true,
      categories: {
        include: {
          category: true
        }
      },
      reviews: {
        include: {
          user: true
        }
      }
    },
    take: limit,
    orderBy: {
      viewCount: 'desc'
    }
  });

  return products.map((product) => serializeProduct(product as unknown as Product));
}

function serializeProduct(product: any): SerializableProduct {
  return {
    ...product,
    price: product.price?.toNumber() ?? 0,
    finalPrice: product.finalPrice?.toNumber() ?? 0,
    discountAmount: product.discountAmount?.toNumber() ?? null,
    createdAt: product.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: product.updatedAt?.toISOString() ?? new Date().toISOString(),
    images: product.images?.map((img: any) => ({
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
    reviews: [] // Default to empty array when reviews don't exist
  };
}

export default function ProductPage() {
  const { slug } = useParams();
  console.log('Page received slug:', slug);
  
  const product = await getProductBySlug(slug);
  
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-600">Product Not Found</h1>
        <p className="mt-4">We couldn&apos;t find a product with the slug: &quot;{slug}&quot;</p>
        <p className="mt-2">This might be because:</p>
        <ul className="list-disc ml-6 mt-2">
          <li>The product doesn&apos;t exist in the database</li>
          <li>The URL might contain special characters that need encoding</li>
          <li>The product ID type change might have affected slug formats</li>
        </ul>
      </div>
    );
  }
  
  const serializedProduct = serializeProduct(product);
  
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
  
  const categoryIds = categories.map(cat => cat.id);
  const relatedProducts = await getRelatedProducts(serializedProduct.id, categoryIds);
  
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
                  <PackageSelector 
                    product={{
                      id: serializedProduct.id,
                      title: serializedProduct.title,
                      price: serializedProduct.price,
                      finalPrice: serializedProduct.finalPrice
                    }}
                  />
                  <AddToPackageButton 
                    product={{
                      id: serializedProduct.id,
                      title: serializedProduct.title,
                      price: serializedProduct.price,
                      finalPrice: serializedProduct.finalPrice
                    }}
                  />
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
          <CartSidebar 
            priceId={serializedProduct.id.toString()}
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
            {relatedProducts.map((relatedProduct) => {
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
      <Toaster position="bottom-right" />
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