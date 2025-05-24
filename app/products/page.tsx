import { Suspense } from "react";
import ResourcesClient from "./ResourcesClient";
import prisma from "@/lib/db";
import { Skeleton } from "@/components/ui/skeleton";
import { revalidatePath } from 'next/cache';
import RefreshButton from "./RefreshButton";

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

export default async function ResourcesPage() {
  let products: ProductWithRelations[] = [];
  let allUniversities: any[] = [];
  let allProductTypes: any[] = [];
  
  try {
    // Try this approach to fetch products while avoiding the problematic user relation
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
        // Skip reviews completely
        CategoryPath: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as unknown as ProductWithRelations[];
    
    // First approach: Fetch all universities directly from the CategoryPath model
    const universitiesFromCategoryPath = await prisma.categoryPath.findMany({
      where: {
        level1: 'university',
        level2: {
          not: null
        }
      },
      select: {
        id: true,
        path: true,
        level1: true,
        level2: true,
        level3: true
      },
      distinct: ['level2']
    });
    
    // Second approach: Also get universities from categories
    const categoriesWithUniversity = await prisma.category.findMany({
      where: {
        name: {
          contains: 'University',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    
    // Get all possible universities from both sources without any reformatting
    // First, get the raw values from CategoryPath
    const rawUniversityValues = universitiesFromCategoryPath.map(uni => uni.level2);
    console.log('Raw university values from CategoryPath:', rawUniversityValues);
    
    // Also get universities from the categories table
    const categoryUniversities = categoriesWithUniversity.map(cat => {
      // Extract slugs like 'university-of-iowa' from the category table
      return cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
    });
    console.log('University values from categories table:', categoryUniversities);
    
    // Combine all university sources
    const combinedUniversities = [...rawUniversityValues, ...categoryUniversities];
    
    // Add these hardcoded values to ensure we have them all
    const hardcodedUniversities = [
      'university-of-iowa',
      'university-of-columbia',
      'university-hawai',
      'chamberlain-university',
      'walden-university'
    ];
    
    // Filter out null/undefined values and cast to string array
    const filteredCombined: string[] = [...combinedUniversities, ...hardcodedUniversities]
      .filter((uni): uni is string => uni !== null && uni !== undefined);
    
    // Use a Set and Array.from to avoid TypeScript issues
    const uniqueSet = new Set<string>(filteredCombined);
    const allPossibleUniversities = Array.from(uniqueSet);
    console.log('All possible universities:', allPossibleUniversities);
    
    // Assign to allUniversities
    allUniversities = allPossibleUniversities;
    
    // Debug: Log all universities data to see what we're getting from the database
    console.log('All universities from database (combined sources):', allUniversities.length);
    console.log('Sample of first 3 universities:', JSON.stringify(allUniversities.slice(0, 3), null, 2));
    
    // Fetch all product types directly from the CategoryPath model
    allProductTypes = await prisma.categoryPath.findMany({
      where: {
        level1: 'product-type',
        level2: {
          not: null
        }
      },
      select: {
        id: true,
        path: true,
        level1: true,
        level2: true,
        level3: true
      },
      distinct: ['level2']
    });
    
    // Debug: Log product types from database
    console.log('All product types from database:', JSON.stringify(allProductTypes, null, 2));
  } catch (error) {
    console.error('Error fetching data:', error);
    
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      
      // Retry fetching products
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
          // Skip reviews completely
          CategoryPath: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }) as unknown as ProductWithRelations[];
      
      // Retry fetching universities
      allUniversities = await prisma.categoryPath.findMany({
        where: {
          level1: "university",
          level2: {
            not: null
          }
        },
        select: {
          level2: true,
        },
        distinct: ['level2']
      });
      
      // Retry fetching product types
      allProductTypes = await prisma.category.findMany({
        where: {
          level: 1,
          isActive: true
        },
        select: {
          name: true,
          id: true,
          slug: true,
        }
      });
    } catch (retryError) {
      console.error('Error retrying data fetch:', retryError);
      products = [];
      allUniversities = [];
      allProductTypes = [];
      revalidatePath('/products');
    }
  }

  if (products.length > 0) {
    console.log("First product images data:", products[0].images);
  }
  
  // Format universities from CategoryPath model data
  console.log('Processing universities, count before formatting:', allUniversities.length);
  
  // SIMPLIFIED: Just use the level2 values directly with no processing at all
  const universitySet = new Set<string>();

  // Process each university entry directly from database with no formatting
  allUniversities.forEach(uni => {
    try {
      // Debug each university object
      console.log('Direct university data from DB:', uni);
      
      // Skip invalid entries
      if (!uni || !uni.level2) {
        console.log('Skipping university with no level2');
        return;
      }
      
      // Use the exact level2 value - this is what appears in the database
      // Do not reformat, extract, or modify it in any way
      const exactDatabaseValue = uni.level2;
      console.log(`✅ Using exact database value: "${exactDatabaseValue}"`);
      universitySet.add(exactDatabaseValue);
    } catch (error) {
      console.error('Error processing university:', error);
    }
  });
  
  // Filter out generic "University" entries
  const filteredUniversities = Array.from(universitySet).filter(uni => {
    // Remove entries that are just "University" or too generic
    if (!uni || uni.trim() === "University" || uni.trim() === "") {
      console.log(`Filtering out generic entry: "${uni}"`);
      return false;
    }
    return true;
  });
  
  // Normalize university names to remove duplicates with slight variations
  const normalizedMap = new Map<string, string>();
  
  filteredUniversities.forEach(uni => {
    // Create a normalized key by removing spaces, converting to lowercase
    const normalizedKey = uni.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/university/g, 'uni')
      .replace(/of/g, '');
    
    // If we haven't seen this university before, add it
    // If we have, keep the longer/more detailed name
    if (!normalizedMap.has(normalizedKey) || uni.length > normalizedMap.get(normalizedKey)!.length) {
      normalizedMap.set(normalizedKey, uni);
    }
  });
  
  // Convert to sorted array
  let formattedUniversities = Array.from(normalizedMap.values()).sort();
  
  // CRITICAL DEBUG: Log detailed information about universities
  console.log(`✅✅✅ UNIVERSITY DEBUG INFO ✅✅✅`);
  console.log(`Raw universities count from DB: ${allUniversities.length}`);
  console.log(`Filtered universities count: ${filteredUniversities.length}`);
  console.log(`Final normalized universities count: ${formattedUniversities.length}`);
  console.log(`Final university list being passed to client:`, JSON.stringify(formattedUniversities, null, 2));
  
  // No fallbacks - only use universities actually found in the database
  console.log(`✅ Using only database universities: ${formattedUniversities.length} entries`);
  
  // Format product types from CategoryPath model data
  console.log('Processing product types, count before formatting:', allProductTypes.length);
  
  const formattedProductTypes = allProductTypes.map(type => {
    console.log('Processing product type:', type);
    
    // Skip if no level2 (product type name)
    if (!type || !type.level2) {
      console.log('Skipping product type with no level2:', type);
      return null;
    }
    
    // Verify it's a product type category
    if (type.level1 !== 'product-type') {
      console.log('Skipping non-product-type category:', type);
      return null;
    }
    
    // Format the product type name from the slug in level2
    const productTypeSlug = type.level2;
    const productTypeName = productTypeSlug
      .replace(/-/g, ' ') // Replace hyphens with spaces
      .replace(/\b(\w)/g, (l: string) => l.toUpperCase()); // Capitalize each word
    
    console.log(`Formatted product type: ${productTypeSlug} -> ${productTypeName}`);
    return productTypeName;
  }).filter(Boolean).sort();
  
  console.log('Formatted product types result:', formattedProductTypes);

  // Skip the review query entirely for now
  // Just use default values for all products
  const resources = products.map(product => {
    const primaryImage = product.images && product.images.length > 0 
      ? product.images.find(img => img.isPrimary) || product.images[0]
      : null;
    
    if (primaryImage) {
      console.log(`Product ${product.id} primary image URL:`, primaryImage.url);
    } else {
      console.log(`Product ${product.id} has no images`);
    }
    
    // Use static data for reviews - no need to look up actual reviews
    const avgRating = "0.0";
    const reviewCount = 0;
    
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
      id: String(product.id),
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
      reviews: reviewCount,
      type: tags[0] || "Study Resource",
      duration: product.accessDuration ? `${product.accessDuration} days` : "Lifetime",
      tags: tags,
      // Convert bigint IDs to strings instead of numbers for consistent handling
      categories: product.categories.map(cat => ({
        ...cat,
        categoryId: String(cat.categoryId), 
        productId: String(cat.productId)
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
        <header className="mb-3 text-center">
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
              <RefreshButton />
            </div>
          ) : (
            <div>
              <ResourcesClient 
                initialResources={resources}
                allUniversities={allUniversities}
                allProductTypes={formattedProductTypes}
              />
            </div>
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