import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

type CategoryWithCount = {
  id: string;
  name: string;
  _count: {
    products: number;
  };
}

type CategoryCount = {
  id: string;
  name: string;
  count: number;
}

// Using the EXACT export syntax that fixed your previous 405 Method Not Allowed error
export async function GET() {
  console.log('ProductsCount API: Starting database query...');
  
  try {
    // Verify database connection first
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log('DATABASE CONNECTION TEST: Success');
    } catch (connectionError) {
      console.error('DATABASE CONNECTION FAILED:', connectionError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        message: String(connectionError)
      }, { status: 500 });
    }
    
    // Get total product count
    console.log('ProductsCount API: Counting products...');
    const totalCount = await prisma.product.count();
    console.log(`ProductsCount API: Found ${totalCount} total products`);
    
    // Get category counts
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    
    // Map categories with counts
    const categoriesWithCounts = categories.map(category => ({
      id: category.id,
      name: category.name,
      count: category._count.products
    }));
    
    // Count by category type
    let studyGuides = 0;
    let practiceTests = 0;
    let videoCourses = 0;
    
    categoriesWithCounts.forEach(category => {
      const name = category.name.toLowerCase();
      if (name.includes('study') || name.includes('guide')) {
        studyGuides += category.count;
      } else if (name.includes('practice') || name.includes('test')) {
        practiceTests += category.count;
      } else if (name.includes('video') || name.includes('course')) {
        videoCourses += category.count;
      }
    });
    
    return NextResponse.json({
      total: totalCount,
      studyGuides,
      practiceTests,
      videoCourses,
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('ProductsCount API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product counts', details: String(error) },
      { status: 500 }
    );
  }
} 