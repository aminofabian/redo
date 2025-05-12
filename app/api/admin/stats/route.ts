import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    
    // Check if user is logged in and is an admin
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get product statistics
    const totalProducts = await prisma.product.count();
    
    // Get products created in the last week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newProductsThisWeek = await prisma.product.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });

    // Get user statistics
    const totalUsers = await prisma.user.count();
    
    // Get users created in the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const newUsersThisMonth = await prisma.user.count({
      where: {
        emailVerified: {
          gte: oneMonthAgo
        }
      }
    });

    // Get sales statistics
    const totalSales = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    });

    // Get sales from previous month to calculate percent change
    const currentMonth = new Date();
    currentMonth.setDate(1); // First day of current month
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    previousMonth.setDate(1); // First day of previous month

    const currentMonthSales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: currentMonth
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    const previousMonthSales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: previousMonth,
          lt: currentMonth
        }
      },
      _sum: {
        totalAmount: true
      }
    });

    // Convert Decimal values to numbers for calculations
    const currentMonthTotal = Number(currentMonthSales._sum.totalAmount || 0);
    const previousMonthTotal = Number(previousMonthSales._sum.totalAmount || 0);

    const salesPercentChange = previousMonthTotal === 0 
      ? 100 
      : ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;

    // Calculate average order value
    const orderCount = await prisma.order.count();
    const avgOrderValue = orderCount === 0 
      ? 0 
      : Number(totalSales._sum.totalAmount || 0) / orderCount;

    // Calculate average order value percent change
    const currentMonthOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: currentMonth
        }
      }
    });

    const previousMonthOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: previousMonth,
          lt: currentMonth
        }
      }
    });

    const currentMonthAvg = currentMonthOrders === 0 
      ? 0 
      : Number(currentMonthSales._sum.totalAmount || 0) / currentMonthOrders;
      
    const previousMonthAvg = previousMonthOrders === 0 
      ? 0 
      : Number(previousMonthSales._sum.totalAmount || 0) / previousMonthOrders;
      
    const avgOrderValuePercentChange = previousMonthAvg === 0 
      ? 100 
      : ((currentMonthAvg - previousMonthAvg) / previousMonthAvg) * 100;

    // Get recent activity
    const recentPurchases = await prisma.order.findMany({
      take: 3,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                title: true
              }
            }
          },
          take: 1
        }
      }
    });

    const recentRegistrations = await prisma.user.findMany({
      take: 2,
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        name: true,
        image: true,
        emailVerified: true
      }
    });

    // Combine and format recent activity
    const recentActivity = [
      ...recentPurchases.map(order => ({
        id: order.id,
        type: 'purchase',
        user: {
          id: order.user.id,
          name: order.user.name,
          image: order.user.image
        },
        productName: order.orderItems[0]?.product.title || 'Product',
        timestamp: order.createdAt
      })),
      ...recentRegistrations.map(user => ({
        id: user.id,
        type: 'registration',
        user: {
          id: user.id,
          name: user.name,
          image: user.image
        },
        timestamp: user.emailVerified || new Date()
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 5);

    return NextResponse.json({
      totalProducts,
      newProductsThisWeek,
      totalUsers,
      newUsersThisMonth,
      totalSales: Number(totalSales._sum.totalAmount || 0),
      salesPercentChange,
      avgOrderValue,
      avgOrderValuePercentChange,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 