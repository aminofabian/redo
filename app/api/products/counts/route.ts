import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get total product count
    const totalCount = await prisma.product.count();
    
    // Get category counts
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });
    
    // Format the counts
    const categoryCounts = categories.map(category => ({
      id: category.id,
      name: category.name,
      count: category._count.products
    }));
    
    // Find specific category counts
    const studyGuides = categoryCounts.find(c => c.name.toLowerCase() === 'study guides')?.count || 0;
    const practiceTests = categoryCounts.find(c => c.name.toLowerCase() === 'practice tests')?.count || 0;
    const videoCourses = categoryCounts.find(c => c.name.toLowerCase() === 'video courses')?.count || 0;
    
    return NextResponse.json({
      total: totalCount,
      categories: categoryCounts,
      studyGuides,
      practiceTests,
      videoCourses
    });
  } catch (error) {
    console.error('Error fetching product counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product counts' },
      { status: 500 }
    );
  }
} 