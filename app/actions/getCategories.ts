'use server';

import { db } from "@/lib/db";

const categoryImages = [
  '/categories/national-cancer-institute-NFvdKIhxYlU-unsplash.jpg',
  '/categories/hush-naidoo-jade-photography-eKNswc0Qxz8-unsplash.jpg',
  '/categories/olga-guryanova-tMFeatBSS4s-unsplash.jpg',
  '/categories/marissa-grootes-flRm0z3MEoA-unsplash.jpg',
  '/categories/sincerely-media--IIIr1Hu6aY-unsplash.jpg',
  '/categories/fahrul-azmi-cFUZ-6i83vs-unsplash.jpg',
  '/categories/julia-taubitz-6JUYocDPaZo-unsplash.jpg',
  '/categories/owen-beard-DK8jXx1B-1c-unsplash.jpg',
  '/categories/paul-felberbauer-QL7iY3G24z4-unsplash.jpg',
  '/categories/robina-weermeijer-NIuGLCC7q54-unsplash.jpg',
  '/categories/element5-digital-OyCl7Y4y0Bk-unsplash.jpg',
  '/categories/tony-luginsland-qS1bDAxxAYg-unsplash.jpg',
  '/categories/alexander-grey-eMP4sYPJ9x0-unsplash.jpg'
];

type CategoryWithProducts = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  _count: {
    products: number;
  };
  products: {
    product: {
      price: number;
      purchaseCount: number;
    };
  }[];
}

export async function getCategories(options?: {
  parentId?: string | null;
  level?: number;
  includeInactive?: boolean;
  limit?: number;
}) {
  const { parentId = null, level, includeInactive = false, limit } = options || {};
  
  try {
    const categories = await db.category.findMany({
      where: {
        parentId,
        level: level,
        ...(includeInactive ? {} : { isActive: true }),
      },
      include: {
        _count: {
          select: {
            products: true,
            children: true
          }
        },
        children: {
          where: includeInactive ? {} : { isActive: true },
          include: {
            _count: {
              select: { products: true }
            }
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
      ...(limit ? { take: limit } : {})
    });

    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

// Function to get full category hierarchy as a tree
export async function getCategoryTree() {
  try {
    // Adjust query for current DB state - don't filter on fields that might not exist yet
    const rootCategories = await db.category.findMany({
      where: {
        parentId: null, // Use this instead of level: 1
      },
      include: {
        _count: {
          select: { products: true }
        }
      },
      orderBy: {
        name: 'asc',
      }
    });

    // Then fetch children for each root category
    const result = await Promise.all(
      rootCategories.map(async (rootCategory) => {
        const children = await getChildrenRecursive(rootCategory.id);
        return {
          ...rootCategory,
          children
        };
      })
    );

    return result;
  } catch (error) {
    console.error("Failed to fetch category tree:", error);
    return [];
  }
}

// Helper function to get children recursively
async function getChildrenRecursive(parentId: string) {
  const children = await db.category.findMany({
    where: {
      parentId,
      isActive: true
    },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: {
      name: 'asc',
    }
  });

  if (children.length === 0) return [];

  const result = await Promise.all(
    children.map(async (child) => {
      const grandchildren = await getChildrenRecursive(child.id);
      return {
        ...child,
        children: grandchildren
      };
    })
  );

  return result;
}

// Get category by path
export async function getCategoryByPath(path: string) {
  try {
    const category = await db.category.findFirst({
      where: {
        path,
        isActive: true
      },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { name: 'asc' }
        },
        _count: {
          select: { products: true }
        }
      }
    });

    return category;
  } catch (error) {
    console.error(`Failed to fetch category with path ${path}:`, error);
    return null;
  }
}

export async function getAllCategoriesWithStats() {
  const categories = await db.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      _count: {
        select: { products: true }
      },
      products: {
        select: {
          product: {
            select: {
              price: true,
              purchaseCount: true
            }
          }
        }
      }
    }
  });

  // Debug logging
  console.log("Available image mappings:", categoryImages);
  console.log("Database category slugs:", categories.map((c: CategoryWithProducts) => c.slug));

  return categories.map((category: CategoryWithProducts, index: number) => {
    const prices = category.products.map((p: { product: { price: number } }) => Number(p.product.price));
    const avgPrice = prices.length > 0 
      ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length 
      : 0;
    const studentCount = category.products.reduce((sum: number, p: { product: { purchaseCount: number } }) => 
      sum + (p.product.purchaseCount || 0), 0);

    console.log(`Category "${category.slug}" mapped to image: "${categoryImages[index % categoryImages.length]}"`);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      productCount: category._count.products,
      averagePrice: avgPrice,
      studentCount,
      image: categoryImages[index % categoryImages.length]
    };
  });
} 