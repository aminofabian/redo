import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the first product with all its relations
    const product = await db.product.findFirst({
      include: {
        images: true,
        categories: {
          include: {
            category: true,
          },
        },
        purchases: true,
        createdBy: true,
      },
    });
    
    if (!product) {
      return NextResponse.json({ message: 'No products found in database' });
    }
    
    // Return the raw product structure
    return NextResponse.json({
      rawProduct: product,
      schema: {
        id: typeof product.id,
        title: typeof product.title,
        slug: typeof product.slug,
        price: typeof product.price,
        images: Array.isArray(product.images),
        categories: Array.isArray(product.categories),
        purchases: Array.isArray(product.purchases),
      }
    });
  } catch (error) {
    console.error('Debug product error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
} 