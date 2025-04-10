import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Get all products with their slugs
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        slug: true
      }
    });
    
    return NextResponse.json({
      count: products.length,
      products: products
    });
  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
} 