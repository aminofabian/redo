'use server';

import { prisma } from "@/lib/prisma";
import { cache } from 'react';

// Cache the data fetching
export const getCategoryPaths = cache(async () => {
  try {
    // Optimize the query by combining both queries into one
    const paths = await prisma.categoryPath.findMany({
      where: {
        level1: 'university',
        level2: { not: null }, // Only get paths with university names
      },
      distinct: ['level2'],
      select: {
        id: true,
        path: true,
        level2: true,
        level1: true,
        level3: true,
        level4: true,
        level5: true,
        product: {
          select: {
            id: true,
            title: true,
            price: true,
          }
        }
      },
      take: 7,
      orderBy: {
        level2: 'asc'
      }
    });

    return paths.map(path => ({
      ...path,
      product: {
        ...path.product,
        price: Number(path.product.price)
      }
    }));
  } catch (error) {
    console.error('Error fetching category paths:', error);
    return [];
  }
}); 