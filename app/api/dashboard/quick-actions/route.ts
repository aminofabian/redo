// app/api/dashboard/quick-actions/route.ts
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

    // 🔒 Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In a real implementation, these actions would be fetched from the database 
    // based on the user's role, course progress, and other factors
    const quickActions = [
      { 
        iconName: 'ShoppingCart', 
        label: 'Buy Materials', 
        href: '/store', 
        color: 'bg-blue-500' 
      },
      { 
        iconName: 'FileText', 
        label: 'Start Test', 
        href: '/dashboard/tests', 
        color: 'bg-purple-500' 
      },
      { 
        iconName: 'BookMarked', 
        label: 'Study Plan', 
        href: '/dashboard/study-plan', 
        color: 'bg-amber-500' 
      },
      { 
        iconName: 'Download', 
        label: 'Quick Download', 
        href: '/dashboard/downloads', 
        color: 'bg-green-500' 
      }
    ];

    return NextResponse.json(quickActions);
  } catch (error) {
    console.error('Error fetching quick actions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quick actions' },
      { status: 500 }
    );
  }
}
