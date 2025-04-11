import { NextRequest, NextResponse } from 'next/server';
import db  from '@/lib/db';
import { auth } from '@/lib/auth';

type Order = {
  id: string;
  totalAmount: number;
  createdAt: Date;
  user: { id: string; name: string; image: string };
  items: { product: { title: string } }[];
}

type User = {
  id: string;
  name: string;
  image: string;
  createdAt: Date;
}

type Review = {
  id: string;
  user: { id: string; name: string; image: string };
  product: { title: string };
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date and date from a week/month ago for comparisons
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    // Get total products count
    const totalProducts = await db.product.count();
    
    // Get products created in the last week
    const newProductsThisWeek = await db.product.count({
      where: {
        createdAt: {
          gte: oneWeekAgo
        }
      }
    });
    
    // Get total users count
    const totalUsers = await db.user.count();
    
    // Get users registered in the last month
    const newUsersThisMonth = await db.user.count({
      where: {
        createdAt: {
          gte: oneMonthAgo
        }
      }
    });
    
    // Get total sales amount
    const orders: Order[] = await db.order.findMany({
      select: {
        totalAmount: true,
        createdAt: true
      }
    });
    
    const totalSales = orders.reduce((sum: number, order: Order) => sum + Number(order.totalAmount), 0);
    
    // Get sales from last month
    const lastMonthOrders = orders.filter((order: Order) => order.createdAt >= oneMonthAgo);
    const lastMonthSales = lastMonthOrders.reduce((sum: number, order: Order) => sum + Number(order.totalAmount), 0);
    
    // Get sales from two months ago for comparison
    const twoMonthsAgo = new Date(oneMonthAgo);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);
    
    const twoMonthsAgoOrders = orders.filter(
      order => order.createdAt >= twoMonthsAgo && order.createdAt < oneMonthAgo
    );
    const twoMonthsAgoSales = twoMonthsAgoOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Calculate sales percentage change
    const salesPercentChange = twoMonthsAgoSales > 0 
      ? ((lastMonthSales - twoMonthsAgoSales) / twoMonthsAgoSales) * 100 
      : 0;
    
    // Calculate average order value
    const avgOrderValue = orders.length > 0 ? totalSales / orders.length : 0;
    const lastMonthAvgOrderValue = lastMonthOrders.length > 0 
      ? lastMonthSales / lastMonthOrders.length 
      : 0;
    const twoMonthsAgoAvgOrderValue = twoMonthsAgoOrders.length > 0 
      ? twoMonthsAgoSales / twoMonthsAgoOrders.length 
      : 0;
    
    // Calculate average order value percentage change
    const avgOrderValuePercentChange = twoMonthsAgoAvgOrderValue > 0 
      ? ((lastMonthAvgOrderValue - twoMonthsAgoAvgOrderValue) / twoMonthsAgoAvgOrderValue) * 100 
      : 0;
    
    // Get recent activity
    const recentActivity = await getRecentActivity();
    
    return NextResponse.json({
      totalProducts,
      newProductsThisWeek,
      totalUsers,
      newUsersThisMonth,
      totalSales,
      salesPercentChange,
      avgOrderValue,
      avgOrderValuePercentChange,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}

async function getRecentActivity() {
  // Get recent orders
  const recentOrders = await db.order.findMany({
    take: 5,
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
      items: {
        include: {
          product: {
            select: {
              title: true
            }
          }
        }
      }
    }
  });
  
  // Get recent user registrations
  const recentRegistrations = await db.user.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true
    }
  });
  
  // Get recent reviews
  const recentReviews = await db.review.findMany({
    take: 5,
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
      product: {
        select: {
          title: true
        }
      }
    }
  });
  
  // Combine and sort all activities
  const allActivities = [
    ...recentOrders.map((order: Order) => ({
      type: 'purchase',
      user: order.user,
      productName: order.items[0]?.product.title || 'a product',
      timestamp: order.createdAt,
      id: `order-${order.id}`
    })),
    ...recentRegistrations.map((user: User) => ({
      type: 'registration',
      user: {
        id: user.id,
        name: user.name,
        image: user.image
      },
      timestamp: user.createdAt,
      id: `reg-${user.id}`
    })),
    ...recentReviews.map((review: Review) => ({
      type: 'review',
      user: review.user,
      productName: review.product.title,
      timestamp: review.createdAt,
      id: `review-${review.id}`
    }))
  ];
  
  // Sort by timestamp (most recent first)
  allActivities.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  // Return the 10 most recent activities
  return allActivities.slice(0, 10);
} 