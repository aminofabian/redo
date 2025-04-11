import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Check if the database is accessible
    const productCount = await prismadb.product.count();
    
    // Get the schema information
    const products = await prismadb.product.findMany({
      take: 1,
      select: {
        id: true,
        title: true,
        // Add other fields you want to check
      }
    });
    
    return NextResponse.json({
      status: 'ok',
      dbConnection: 'working',
      productCount,
      sampleProduct: products[0] || null,
    });
  } catch (error) {
    console.error('Debug route error:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
} 