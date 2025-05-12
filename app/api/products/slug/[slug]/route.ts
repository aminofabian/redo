import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Recursive function to handle BigInt serialization throughout the object
function serializeData(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }
  
  // Handle BigInt specifically
  if (typeof data === 'bigint') {
    return data.toString();
  }
  
  // Handle Decimal.js objects (common with Prisma)
  if (data && typeof data.toNumber === 'function') {
    return data.toNumber();
  }
  
  // Handle Date objects
  if (data instanceof Date) {
    return data.toISOString();
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => serializeData(item));
  }
  
  // Handle objects
  if (typeof data === 'object') {
    const result: Record<string, any> = {};
    for (const key in data) {
      result[key] = serializeData(data[key]);
    }
    return result;
  }
  
  // Return primitive values as is
  return data;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;
    
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: true,
        categories: {
          include: {
            category: true
          }
        }
      }
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Recursively serialize the entire product object
    const serializedProduct = serializeData(product);

    return NextResponse.json(serializedProduct);
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
} 