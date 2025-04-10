import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "../../../lib/db";
import { getProductBySlug, getAllProducts, generateProductSlug, extractIdFromSlug } from "../../../lib/products";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Clock, Download, DollarSign, ShoppingCart, Tag, Users } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import EditSlugButton from "./EditSlugButton";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug }
  });
  
  if (!product) {
    return {
      title: "Resource Not Found",
      description: "The requested resource could not be found."
    };
  }
  
  return {
    title: `${product.title} | RN Student Resources`,
    description: product.description || "",
  };
}

export async function generateStaticParams() {
  const products = await getAllProducts();
  
  return products.map((product) => ({
    slug: generateProductSlug(product),
  }));
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
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
  
  // Calculate various display values
  const hasDiscount = product.discountAmount && product.discountAmount.toNumber() > 0;
  const formattedPrice = formatPrice(product.price);
  const formattedFinalPrice = formatPrice(product.finalPrice);
  const discountText = product.discountPercent ? `${product.discountPercent}% off` : '';
  const createdAt = new Date(product.createdAt);
  const updatedAt = new Date(product.updatedAt);
  const timeAgo = formatDistanceToNow(updatedAt, { addSuffix: true });
  
  // Get categories from the product
  const categories = product.categories?.map(cat => cat.category) || [];
  
  console.log("Product price data:", {
    price: product.price,
    finalPrice: product.finalPrice,
    discountAmount: product.discountAmount,
    discountPercent: product.discountPercent
  });
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Images */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold">{product.title}</h1>
              
              <EditSlugButton product={product} />
            </div>
            
            <div className="text-sm text-gray-500 mb-4 flex items-center">
              <span className="mr-2">URL:</span>
              <code className="bg-gray-100 px-2 py-1 rounded">
                /products/{product.slug}
              </code>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(category => (
                <span key={category.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {category.name}
                </span>
              ))}
            </div>
            
            <div className="flex items-center text-sm text-gray-500 mb-6">
              <Clock className="h-4 w-4 mr-1" />
              <span>Updated {timeAgo}</span>
              <span className="mx-2">•</span>
              <Users className="h-4 w-4 mr-1" />
              <span>{product.purchaseCount} purchases</span>
              <span className="mx-2">•</span>
              <Tag className="h-4 w-4 mr-1" />
              <span>ID: #{product.id}</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main image */}
              <div className="aspect-video relative rounded-md overflow-hidden border bg-gray-50">
                {product.images && product.images.length > 0 ? (
                  <Image 
                    src={product.images.find(img => img.isPrimary)?.url || product.images[0].url}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">No image available</p>
                  </div>
                )}
              </div>
              
              {/* Product info */}
              <div>
                <div className="mb-4">
                  {hasDiscount ? (
                    <>
                      <div className="flex flex-col">
                        <p className="text-3xl font-bold text-green-700">{formattedFinalPrice}</p>
                        <p className="text-lg text-gray-500 line-through">Original: {formattedPrice}</p>
                      </div>
                      <div className="mt-2 inline-block">
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1.5 rounded-md">
                          {discountText ? `SAVE ${discountText}` : `SAVE ${formatPrice(product.price.toNumber() - product.finalPrice.toNumber())}`}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{formattedPrice}</p>
                  )}
                </div>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Access Duration</h3>
                    <p>{product.accessDuration ? `${product.accessDuration} days` : "Unlimited"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Download Limit</h3>
                    <p>{product.downloadLimit ? `${product.downloadLimit} downloads` : "Unlimited"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500 mb-1">Availability</h3>
                    <p className={product.inStock ? "text-green-600" : "text-red-600"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full flex items-center justify-center">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Add to Cart
                  </Button>
                  
                  {product.downloadUrl && (
                    <Button variant="outline" className="w-full flex items-center justify-center">
                      <Download className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h2 className="text-xl font-bold mb-4">Description</h2>
            <div className="prose max-w-none">
              {product.description ? (
                <p>{product.description}</p>
              ) : (
                <p className="text-gray-500 italic">No description available for this product.</p>
              )}
            </div>
          </div>
          
          {/* Additional images */}
          {product.images && product.images.length > 1 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border mt-6">
              <h2 className="text-xl font-bold mb-4">Gallery</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {product.images.map(image => (
                  <div key={image.id} className="aspect-video relative rounded-md overflow-hidden border">
                    <Image 
                      src={image.url}
                      alt={image.alt || product.title}
                      fill
                      className="object-cover"
                    />
                    {image.isPrimary && (
                      <div className="absolute bottom-1 right-1 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Right column - Sidebar */}
        <div>
          {/* Product details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h2 className="text-xl font-bold mb-4">Product Details</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm text-gray-500">Product ID</dt>
                <dd>#{product.id}</dd>
              </div>
              
              <div>
                <dt className="text-sm text-gray-500">Created</dt>
                <dd>{formatDate(createdAt)}</dd>
              </div>
              
              <div>
                <dt className="text-sm text-gray-500">Last Updated</dt>
                <dd>{formatDate(updatedAt)}</dd>
              </div>
              
              <div>
                <dt className="text-sm text-gray-500">Status</dt>
                <dd>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    product.isPublished 
                      ? "bg-green-100 text-green-800" 
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {product.isPublished ? "Published" : "Draft"}
                  </span>
                </dd>
              </div>
              
              {product.featured && (
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
          
          {/* Analytics */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <h2 className="text-xl font-bold mb-4">Analytics</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Views</p>
                  <p className="text-xl font-medium">{product.viewCount}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Downloads</p>
                  <p className="text-xl font-medium">{product.downloadCount}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Purchases</p>
                  <p className="text-xl font-medium">{product.purchaseCount}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-xl font-medium">{formatPrice(product.totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Categories */}
          {categories.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4">Categories</h2>
              <div className="space-y-2">
                {categories.map(category => (
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

{product.viewCount > 0 && (
  <div className="flex justify-between border-b pb-2">
    <span className="text-muted-foreground">Views:</span>
    <span className="font-medium">{product.viewCount} people viewed this resource</span>
  </div>
)} 