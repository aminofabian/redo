import { NextResponse } from 'next/server';
import prisma from '@/lib/db'; // Make sure to use your existing Prisma client instance

export async function GET() {
  try {
    // Fetch universities from CategoryPath similar to your products page
    const allUniversities = await prisma.categoryPath.findMany({
      where: {
        level1: 'university',
        level2: {
          not: null
        }
      },
      select: {
        id: true,
        level1: true,
        level2: true,
        level3: true,
        path: true
      },
      distinct: ['level2']
    });
    
    // Log the result to check what's being returned
    console.log('Universities found:', allUniversities.length);
    
    return NextResponse.json(allUniversities);
  } catch (error) {
    console.error('API Error fetching universities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 