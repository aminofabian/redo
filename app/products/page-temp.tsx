import { Suspense } from "react";
import ResourcesClient from "./ResourcesClient";
import prisma from "@/lib/db";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidatePath } from 'next/cache';
// Use Prisma types for database results
import { Prisma } from "@prisma/client";

// Use Prisma's ProductWithIncludes type for database results
type ProductWithRelations = {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  price: bigint;
  finalPrice: bigint;
  discountPercent: number | null;
  accessDuration: number | null;
  downloadLimit: number | null;
  featured: boolean;
  viewCount: number;
  images: {
    id: string;
    createdAt: Date;
    productId: bigint; // Change from number to bigint
    url: string;
    alt: string | null;
    isPrimary: boolean;
  }[];
  categories: {
    category: {
      name: string;
      id: string;
      slug: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      parentId: string | null;
    };
    categoryId: bigint;
    productId: bigint;
  }[];
  reviews: {
    user: {
      firstName: string | null;
      lastName: string | null;
      image: string | null;
    };
    id: string;
    userId: string;
    rating: number;
    comment: string | null;
    productId: bigint; // Change from number to bigint
    createdAt: Date;
    updatedAt: Date;
  }[];
  CategoryPath: any[];
};

// Server component to fetch products
export default async function ResourcesPage() {
  let products: ProductWithRelations[] = [];
  
  try {
    // Fetch products with related data
    products = await prisma.product.findMany({
      where: {
        isPublished: true,
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
            user: {
              select: {
                firstName: true,
                lastName: true,
                image: true
              }
            }
          }
        },
        CategoryPath: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as unknown as ProductWithRelations[];
  } catch (error) {
    // Log the error for debugging
    console.error('Error fetching products:', error);
    
    // Attempt to reconnect to the database
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      
      // Retry the query once
      products = await prisma.product.findMany({
        where: {
          isPublished: true,
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
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  image: true
                }
              }
            }
          },
          CategoryPath: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }) as unknown as ProductWithRelations[];
    } catch (retryError) {
      console.error('Error retrying product fetch:', retryError);
      // If retry fails, return empty array to prevent page crash
      products = [];
      // Revalidate the page after a short delay
      revalidatePath('/products');
    }
  }

  // Debug image data for troubleshooting
  if (products.length > 0) {
    console.log("First product images data:", products[0].images);
  }

  // Map database products to the format expected by the UI
  const resources = products.map(product => {
    // Find primary image or use the first one
    const primaryImage = product.images && product.images.length > 0 
      ? product.images.find(img => img.isPrimary) || product.images[0]
      : null;
    
    // Debug the image URL we're extracting
    if (primaryImage) {
      console.log(`Product ${product.id} primary image URL:`, primaryImage.url);
    } else {
      console.log(`Product ${product.id} has no images`);
    }
    
    // Calculate average rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = product.reviews.length > 0 
      ? (totalRating / product.reviews.length).toFixed(1)
      : "0.0";
    
    // Extract categories as tags
    const tags = product.categories.map(c => c.category.name);
    
    // Process primary image URL to ensure it's valid and complete
    let imageUrl = "/placeholder-image.jpg";
    
    if (primaryImage?.url) {
      // Make sure URL is properly formatted - either full http URL or starts with /
      if (primaryImage.url.startsWith('http')) {
        // It's already a complete URL
        imageUrl = primaryImage.url;
      } else if (primaryImage.url.startsWith('/')) {
        // It's a path from root
        imageUrl = primaryImage.url;
      } else {
        // Add leading slash if missing
        imageUrl = `/${primaryImage.url}`;
      }
      
      console.log(`Formatted primary image URL for product ${product.id}:`, imageUrl);
    }
    
    // Process all images and format their URLs correctly
    const processedImages = product.images && product.images.length > 0
      ? product.images.map(img => {
          let imgUrl = "/placeholder-image.jpg";
          
          if (img.url) {
            // Format URL consistently
            if (img.url.startsWith('http')) {
              imgUrl = img.url;
            } else if (img.url.startsWith('/')) {
              imgUrl = img.url;
            } else {
              imgUrl = `/${img.url}`;
            }
          }
          
          return {
            id: img.id,
            url: imgUrl,
            alt: img.alt || product.title,
            isPrimary: img.isPrimary
          };
        })
      : [{ id: '0', url: '/placeholder-image.jpg', alt: product.title, isPrimary: true }];
    
    console.log(`Product ${product.id} has ${processedImages.length} images mapped`);

    // Format to match current UI expectations
    return {
      id: String(product.id), // Convert BigInt to string
      slug: product.slug || String(product.id),
      title: product.title,
      description: product.description || "",
      image: imageUrl, // Keep old format for backward compatibility
      images: processedImages, // Add the full array of processed images
      price: Number(product.price),
      finalPrice: Number(product.finalPrice),
      discountPercent: product.discountPercent ?? undefined,
      hasDiscount: Number(product.finalPrice) < Number(product.price),
      monthlyPrice: Math.round(Number(product.finalPrice) / 3),
      rating: avgRating,
      reviews: product.reviews.length,
      type: tags[0] || "Study Resource",
      duration: product.accessDuration ? `${product.accessDuration} days` : "Lifetime",
      tags: tags,
      // Convert bigint IDs to strings instead of numbers for consistent handling
      categories: product.categories.map(cat => ({
        ...cat,
        categoryId: String(cat.categoryId), 
        productId: String(cat.productId)
      })),
      // Also convert reviews productId from bigint to string
      _reviews: product.reviews.map(review => ({
        ...review,
        productId: String(review.productId),
        id: String(review.id)
      })),
      questions: product.description?.includes("questions") ? "2000+ Questions" : undefined,
      chapters: product.description?.includes("chapters") ? "15+ Chapters" : undefined,
      downloadLimit: product.downloadLimit ?? undefined,
      featured: product.featured,
      viewCount: product.viewCount,
      CategoryPath: product.CategoryPath
    };
  });

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Study Resources</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our premium study materials to help you achieve your learning goals. 
            Browse by category or search for specific resources.
          </p>
        </header>
        
        <Suspense fallback={<ResourcesSkeleton />}>
          {products.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm p-8">
              <p className="text-gray-500">Unable to load products. Please try again later.</p>
              <button 
                className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                onClick={() => revalidatePath('/products')}
              >
                Refresh
              </button>
            </div>
          ) : (
            <ResourcesClient initialResources={resources} />
          )}
        </Suspense>
      </div>
    </div>
  );
}

// Skeleton loader while data is being fetched
function ResourcesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-10 text-center">
        <Skeleton className="h-10 w-1/3 mx-auto mb-4" />
        <Skeleton className="h-4 w-2/3 mx-auto" />
      </div>
      
      <div className="mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24 rounded-full flex-shrink-0" />
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array(8).fill(0).map((_, i) => (
          <div key={i} className="flex flex-col">
            <Skeleton className="h-48 w-full rounded-t-lg" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-4 w-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-10 w-28 rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
