import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { safeJSONStringify } from '@/lib/json-utils';

// API endpoint to fetch related products based on product ID and categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productIdParam = searchParams.get('id');
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const limit = parseInt(searchParams.get('limit') || '4');

    // Validate product ID
    if (!productIdParam) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Safely parse the product ID
    let productId: number;
    try {
      productId = parseInt(productIdParam, 10);
      if (isNaN(productId)) {
        throw new Error('Invalid product ID');
      }
    } catch (e) {
      console.error(`Invalid product ID format: ${productIdParam}`, e);
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    // Find the product to get its categories if none specified
    const product = categories.length === 0 
      ? await prisma.product.findUnique({
          where: { id: productId },
          include: {
            categories: {
              include: {
                category: true
              }
            }
          }
        })
      : null;

    // Extract categories from the product if not provided in the query
    const productCategories = product?.categories.map(c => c.category.id) || [];
    const categoryIds = categories.length > 0 ? categories : productCategories;

    // Find related products based on shared categories
    const relatedProducts = await prisma.product.findMany({
      where: {
        AND: [
          { id: { not: productId } }, // Exclude the current product
          { isPublished: true },      // Only published products
          categoryIds.length > 0 
            ? {
                categories: {
                  some: {
                    categoryId: {
                      in: categoryIds
                    }
                  }
                }
              } 
            : {}                     // No category filter if no categories found
        ]
      },
      include: {
        images: true,
        categories: {
          include: {
            category: true
          }
        },
      },
      orderBy: [
        // Products with more matching categories should appear first
        {
          purchaseCount: 'desc', // Then most purchased products
        },
        {
          createdAt: 'desc',     // Then newest products
        }
      ],
      take: limit
    });

    // Format the related products for the client
    const formattedProducts = relatedProducts.map(product => ({
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: parseFloat(product.price.toString()),
      finalPrice: parseFloat(product.finalPrice.toString()),
      discountPercent: product.discountPercent,
      featured: product.featured,
      images: product.images.map(img => ({
        id: img.id,
        url: img.url,
        isPrimary: img.isPrimary
      })),
      categories: product.categories.map(c => ({
        id: c.categoryId,
        name: c.category.name
      }))
    }));

    // Return the formatted products using the safe JSON serializer to handle BigInt
    return new NextResponse(safeJSONStringify(formattedProducts), {
      headers: {
        'content-type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error fetching related products:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch related products', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
