import prisma from "@/lib/db";
import NursingResourcesSection from "./ui/NursingResources";

export default async function FeaturedResources() {
  // First try to fetch featured products
  let products = await prisma.product.findMany({
    where: {
      isPublished: true,
      featured: true,
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
    },
    take: 9
  });

  // If no featured products are found, fetch any published products
  if (products.length === 0) {
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 9
    });
  }

  // Transform the data to match the expected format
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
    
    return {
      id: String(product.id),
      slug: product.slug || String(product.id),
      title: product.title,
      originalPrice: Number(product.price),
      price: Number(product.finalPrice),
      discountPercent: product.discountPercent ?? undefined,
      image: primaryImage?.url || "/placeholder-image.jpg",
      questions: product.description?.includes("questions") ? "2000+ Questions" : undefined,
      students: `${product.viewCount}+ Students`,
      rating: avgRating,
      reviews: product.reviews.length,
      lastUpdated: `Updated ${Math.floor(Math.random() * 7) + 1} days ago`, // Placeholder
      duration: product.accessDuration ? `${product.accessDuration} days` : "Lifetime Access",
      tags: tags
    };
  });

  // Add fallback for debugging - if no resources are found
  if (resources.length === 0) {
    // Create sample resource for debugging
    const fallbackResources = [
      {
        id: "sample1",
        slug: "sample-resource-1",
        title: "Sample Nursing Resource",
        originalPrice: 199.99,
        price: 99.99,
        discountPercent: 50,
        image: "/placeholder-image.jpg",
        questions: "2000+ Questions",
        students: "250+ Students",
        rating: "4.5",
        reviews: 42,
        lastUpdated: "Updated recently",
        duration: "Lifetime Access",
        tags: ["Nursing", "Study Material"]
      },
      // Add more sample resources as needed to fill out the grid
    ];
    
    // Use fallback resources (for development only)
    return <NursingResourcesSection products={fallbackResources} />;
  }

  return <NursingResourcesSection products={resources} />;
} 