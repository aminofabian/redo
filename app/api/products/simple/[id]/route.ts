import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Convert the ID to a number since our schema uses Int for product IDs
    const productId = parseInt(params.id, 10);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      );
    }
    
    // Fetch just the basic product data without relations
    const product = await prismadb.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Transform to match expected format
    const formattedProduct = {
      id: product.id.toString(),
      title: product.title,
      description: product.description || "",
      status: product.isPublished ? "Published" : "Draft",
      price: `$${Number(product.price).toFixed(2)}`,
      lastUpdated: product.updatedAt.toISOString(),
      sales: product.purchaseCount || 0,
      slug: product.slug,
      viewCount: product.viewCount || 0,
    };
    
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error('Error fetching simple product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 