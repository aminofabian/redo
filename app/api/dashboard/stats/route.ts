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

    // Get all user purchases with product data
    const userPurchases = await prisma.purchase.findMany({
      where: {
        userId,
        status: 'completed',
      },
      include: {
        product: true,
      },
    });
    
    // Count total courses enrolled
    const coursesEnrolled = userPurchases.length;
    
    // Get actual download count from Downloads table
    const materialsDownloaded = await prisma.download.count({
      where: {
        userId,
      },
    });
    
    // Tests completed (based on products containing 'test' or 'quiz' in title)
    const testsCompleted = userPurchases.filter(purchase => 
      purchase.product.title.toLowerCase().includes('test') || 
      purchase.product.title.toLowerCase().includes('quiz')
    ).length;
    
    // Calculate study hours based on actual product data
    // For more accurate metrics, we estimate 2 hours per download + 3 hours per course
    const downloadHours = materialsDownloaded * 2;
    const courseHours = coursesEnrolled * 3;
    const studyHours = downloadHours + courseHours;
    
    // Get dashboard stats formatted for display
    const stats = [
      {
        id: 1,
        title: 'Courses Enrolled',
        value: coursesEnrolled,
        iconName: 'BookOpen',
        trend: '+5%',
        color: 'bg-blue-500'
      },
      {
        id: 2,
        title: 'Materials Downloaded',
        value: materialsDownloaded,
        iconName: 'Download',
        trend: '+2%',
        color: 'bg-green-500'
      },
      {
        id: 3,
        title: 'Tests Completed',
        value: testsCompleted,
        iconName: 'CheckCircle',
        trend: '+8%',
        color: 'bg-purple-500'
      },
      {
        id: 4,
        title: 'Study Hours',
        value: studyHours,
        iconName: 'Clock',
        trend: '+3%',
        color: 'bg-orange-500'
      }
    ];

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({ stats: [] }, { status: 500 });
  }
}
