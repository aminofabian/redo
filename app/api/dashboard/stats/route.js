import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

// Set dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// Using global singleton for PrismaClient to prevent connection issues
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Handler for GET requests
export async function GET(request) {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Count courses enrolled (through purchases)
    const coursesEnrolled = await prisma.purchase.count({
      where: {
        userId,
        status: 'completed',
      },
    });

    // Count materials downloaded (based on product download count)
    const materialsDownloaded = await prisma.purchase.count({
      where: {
        userId,
        product: {
          downloadCount: {
            gt: 0,
          },
        },
      },
    });

    // Since we don't have a specific "test completed" or "study hours" model,
    // we'll use product interactions as a proxy or return placeholder counts
    
    // Tests completed (could be based on some interaction or product type)
    const testsCompleted = await prisma.purchase.count({
      where: {
        userId,
        product: {
          title: {
            contains: 'test',
            mode: 'insensitive',
          },
        },
        status: 'completed',
      },
    });

    // Study hours - this is just a placeholder as we don't track this
    // In a real application, you might have a UserActivity table to track this
    const studyHours = coursesEnrolled * 5; // Rough estimate based on courses

    // Get actual trend data by comparing with previous month's data
    // For a real implementation, you would store historical stats and calculate real trends
    // Here we'll use actual data but with empty trends since we don't have historical data
    
    // Format dashboard stats into the expected array format from actual database counts
    const stats = [
      {
        id: 1,
        title: 'Courses Enrolled',
        value: coursesEnrolled,
        iconName: 'BookOpen',
        trend: '',
        color: 'bg-blue-500'
      },
      {
        id: 2,
        title: 'Materials Downloaded',
        value: materialsDownloaded,
        iconName: 'Download',
        trend: '',
        color: 'bg-emerald-500'
      },
      {
        id: 3,
        title: 'Tests Completed',
        value: testsCompleted,
        iconName: 'CheckCircle',
        trend: '',
        color: 'bg-purple-500'
      },
      {
        id: 4,
        title: 'Study Hours', 
        value: Math.round(coursesEnrolled * 2.5), // Calculate based on actual course count
        iconName: 'Clock',
        trend: '',
        color: 'bg-amber-500'
      }
    ];

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}