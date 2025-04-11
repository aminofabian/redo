import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

type Category = Awaited<ReturnType<PrismaClient['category']['findFirst']>>
type Product = Awaited<ReturnType<PrismaClient['product']['findFirst']>>
type ProductImage = Awaited<ReturnType<PrismaClient['productImage']['findFirst']>>

type CategoryWithProducts = Category & {
  products?: Product[];
  images?: ProductImage[];
}

export const revalidate = 3600; // Revalidate once per hour

export async function GET() {
  try {
    // Alternative approach using separate count queries
    const categories = await prisma.category.findMany();
    const categoryCounts = await Promise.all(
      categories.map((category: Category) => 
        prisma.product.count({
          where: {
            categories: {
              some: { categoryId: category.id }
            }
          }
        })
      )
    );

    // Get total products count for percentage calculation
    const totalProducts = await prisma.product.count({
      where: { isPublished: true }
    });

    // Get popular products per category (top seller in each category)
    const categoryStats = await Promise.all(
      categories.map(async (category: Category, index: number) => {
        // Find products in this category
        const productsInCategory = await prisma.product.findMany({
          where: {
            isPublished: true,
            categories: {
              some: {
                categoryId: category.id,
              },
            },
          },
          orderBy: [
            { viewCount: "desc" },
            { purchaseCount: "desc" },
          ],
          take: 1,
          include: {
            images: true,
          },
        });

        // Get average price for this category
        const avgPriceResult = await prisma.product.aggregate({
          where: {
            isPublished: true,
            categories: {
              some: {
                categoryId: category.id,
              },
            },
          },
          _avg: {
            finalPrice: true,
          },
        });

        const topSeller = productsInCategory[0] || null;
        const topSellerImage = topSeller?.images.find((img: ProductImage) => img.isPrimary)?.url || 
                              (topSeller?.images[0]?.url || "/placeholder-image.jpg");

        return {
          id: category.id,
          name: category.name,
          description: category.description,
          slug: category.slug,
          productCount: categoryCounts[index] || 0,
          percentage: totalProducts > 0 
            ? Math.round((categoryCounts[index] || 0) / totalProducts) * 100
            : 0,
          avgPrice: avgPriceResult._avg.finalPrice 
            ? Number(avgPriceResult._avg.finalPrice) 
            : 0,
          topSeller: topSeller 
            ? {
                id: topSeller.id,
                title: topSeller.title,
                image: topSellerImage,
                price: Number(topSeller.finalPrice),
                viewCount: topSeller.viewCount,
              } 
            : null,
        };
      })
    );

    // Sort by product count (highest first)
    categoryStats.sort((a, b) => b.productCount - a.productCount);

    return NextResponse.json(categoryStats);
  } catch (error) {
    console.error("Error fetching category stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch category statistics" },
      { status: 500 }
    );
  }
} 