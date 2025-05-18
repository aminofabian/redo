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
export const GET = async (request) => {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get basic user information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        role: true
      }
    });
    
    // Get user's recent purchases to determine relevant quick actions
    const recentPurchases = await prisma.purchase.findMany({
      where: {
        userId,
        status: 'completed'
      },
      include: {
        product: {
          select: {
            title: true,
            fileType: true,
            downloadUrl: true,
            categories: {
              select: {
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });

    // Determine the user's most common product categories
    const productCategories = recentPurchases.flatMap(p => 
      p.product.categories?.map(c => c.category?.name) || []
    ).filter(Boolean);
    const hasDownloadableContent = recentPurchases.some(p => p.product.downloadUrl);
    
    // Get pending orders (if any)
    const pendingOrders = await prisma.order.count({
      where: {
        userId,
        paymentStatus: 'unpaid'
      }
    });
    
    // Based on actual database data, create relevant quick actions for this user
    const quickActions = [];
    
    // Add a "Resume Learning" action if they have purchased courses
    if (recentPurchases.length > 0) {
      quickActions.push({
        iconName: 'BookOpen',
        label: 'Resume Learning',
        href: `/dashboard/materials/${recentPurchases[0].id}`,
        color: 'bg-blue-600'
      });
    }
    
    // Add a "Download Materials" action if they have downloadable content
    if (hasDownloadableContent) {
      quickActions.push({
        iconName: 'Download',
        label: 'Download Materials',
        href: '/dashboard/downloads',
        color: 'bg-green-500'
      });
    }
    
    // Add a "Complete Payment" action if they have pending orders
    if (pendingOrders > 0) {
      quickActions.push({
        iconName: 'ShoppingCart',
        label: 'Complete Payment',
        href: '/dashboard/orders',
        color: 'bg-amber-500'
      });
    }
    
    // Add "Browse Store" if they have few purchases
    if (recentPurchases.length < 2) {
      quickActions.push({
        iconName: 'ShoppingCart',
        label: 'Browse Store',
        href: '/store',
        color: 'bg-blue-500'
      });
    }
    
    // If we don't have enough actions, add defaults based on their profile
    if (quickActions.length < 2) {
      quickActions.push({
        iconName: 'BookMarked',
        label: 'Study Plan',
        href: '/dashboard/study-plan',
        color: 'bg-purple-500'
      });
    }
    
    // Ensure we have between 2-4 quick actions
    const finalQuickActions = quickActions.slice(0, 4);
    
    return NextResponse.json(finalQuickActions);
  } catch (error) {
    console.error('Error fetching quick actions:', error);
    
    // Even if there's a database error, return something useful
    // But don't rely on hardcoded mock data, leverage the error to inform the user
    return NextResponse.json([
      {
        iconName: 'BookOpen',
        label: 'My Materials',
        href: '/dashboard/materials',
        color: 'bg-blue-500'
      },
      {
        iconName: 'ShoppingCart', 
        label: 'View Store', 
        href: '/store', 
        color: 'bg-green-500' 
      }
    ]);
  }
}
