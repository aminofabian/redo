import { Suspense } from "react";
import ResourcesClient from "./ResourcesClient";
import prisma from "@/lib/db";
import { Skeleton } from "@/components/ui/skeleton";

// Server component to fetch products
export default async function ResourcesPage() {
  // Fetch products with related data
  const products = await prisma.product.findMany({
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
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Map database products to the format expected by the UI
  const resources = products.map(product => {
    // Find primary image or use the first one
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    
    // Calculate average rating
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    const avgRating = product.reviews.length > 0 
      ? (totalRating / product.reviews.length).toFixed(1)
      : "0.0";
    
    // Extract categories as tags
    const tags = product.categories.map(c => c.category.name);
    
    // Format to match current UI expectations
    return {
      id: String(product.id),
      slug: product.slug || String(product.id),
      title: product.title,
      description: product.description || "",
      image: primaryImage?.url || "/placeholder-image.jpg",
      price: Number(product.price),
      finalPrice: Number(product.finalPrice),
      discountPercent: product.discountPercent ?? undefined,
      hasDiscount: Number(product.finalPrice) < Number(product.price),
      monthlyPrice: Math.round(Number(product.finalPrice) / 3), // Monthly price calculation based on final price
      rating: avgRating,
      reviews: product.reviews.length,
      type: tags[0] || "Study Resource", // Use first category as type
      duration: product.accessDuration ? `${product.accessDuration} days` : "Lifetime",
      tags: tags,
      categories: product.categories,
      questions: product.description?.includes("questions") ? "2000+ Questions" : undefined,
      chapters: product.description?.includes("chapters") ? "15+ Chapters" : undefined,
      downloadLimit: product.downloadLimit ?? undefined,
      featured: product.featured,
      viewCount: product.viewCount
    };
  });

  return (
    <Suspense fallback={<ResourcesSkeleton />}>
      <ResourcesClient initialResources={resources} />
    </Suspense>
  );
}

// Skeleton loader while data is being fetched
function ResourcesSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Skeleton className="h-10 w-1/3 mb-4" />
        <Skeleton className="h-5 w-2/3 mb-4" />
        <Skeleton className="h-5 w-1/4" />
      </div>
      
      <div className="flex gap-8">
        <div className="w-64 flex-shrink-0">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-8 w-40" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-[320px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 