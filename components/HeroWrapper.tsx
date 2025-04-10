import prisma from "@/lib/db";
import Hero from "@/components/ui/Hero";
import { cache } from "react";

// Use React's cache to prevent redundant database calls
const getCategories = cache(async () => {
  try {
    console.log("HERO WRAPPER: Starting category fetch from database");
    
    // Get all categories first - simple query to debug
    const allCategories = await prisma.category.findMany();
    console.log(`HERO WRAPPER: Database has ${allCategories.length} total categories`);
    console.log("HERO WRAPPER: Category names:", allCategories.map(c => c.name));
    
    // If we have categories, continue with enrichment
    if (allCategories.length > 0) {
      // Get detailed stats for each category
      const categoriesWithStats = await Promise.all(
        allCategories.slice(0, 7).map(async (category) => {
          console.log(`HERO WRAPPER: Processing category: ${category.name}`);
          
          // Count products for this category
          const productCount = await prisma.product.count({
            where: {
              categories: {
                some: {
                  categoryId: category.id,
                },
              },
              isPublished: true,
            },
          });
          
          console.log(`HERO WRAPPER: Category ${category.name} has ${productCount} products`);
          
          // Get average price for this category
          const avgPriceResult = await prisma.product.aggregate({
            where: {
              categories: {
                some: {
                  categoryId: category.id,
                },
              },
              isPublished: true,
            },
            _avg: {
              finalPrice: true,
            },
          });
          
          const avgPrice = avgPriceResult._avg.finalPrice 
            ? Number(avgPriceResult._avg.finalPrice).toFixed(2)
            : "0.00";
          
          console.log(`HERO WRAPPER: Category ${category.name} average price: $${avgPrice}`);
          
          return {
            id: category.id,
            title: category.name,
            image: category.imageUrl || `/categories/element5-digital-OyCl7Y4y0Bk-unsplash.jpg`,
            students: `${Math.floor(Math.random() * 10) + 2}K+`,
            rating: 4.5 + Math.random() * 0.4,
            tag: undefined,
            resourceCount: productCount,
            averagePrice: avgPrice
          };
        })
      );
      
      // Sort by number of resources (highest first)
      categoriesWithStats.sort((a, b) => b.resourceCount - a.resourceCount);
      
      // Add "Most Popular" tag to the first one
      if (categoriesWithStats.length > 0) {
        categoriesWithStats[0].tag = "Most Popular";
      }
      
      console.log("HERO WRAPPER: Final category data being sent to Hero:", 
        categoriesWithStats.map(c => `${c.title} (${c.resourceCount} resources, $${c.averagePrice})`));
      
      return categoriesWithStats;
    } else {
      console.log("HERO WRAPPER: No categories found in database, will use placeholders");
      return [];
    }
  } catch (error) {
    console.error("HERO WRAPPER: Error fetching categories:", error);
    return [];
  }
});

export default async function HeroWrapper() {
  console.log("HERO WRAPPER: Component rendering");
  const categories = await getCategories();
  console.log(`HERO WRAPPER: Got ${categories.length} categories to display`);
  
  if (categories.length === 0) {
    console.log("HERO WRAPPER: Warning - passing empty categories to Hero");
  }
  
  return <Hero categories={categories} />;
} 