// app/api/dashboard/stats/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/src/generated/client';

// Use PrismaClient as a singleton to prevent connection pool exhaustion
const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export const GET = async () => {
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

    return NextResponse.json({
      coursesEnrolled,
      materialsDownloaded,
      testsCompleted,
      studyHours,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
