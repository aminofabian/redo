import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
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
  image: string | null;
  emailVerified: Date | null;
}

type Review = {
  id: string;
  user: { id: string; name: string; image: string };
  product: { title: string };
  createdAt: Date;
}

type Purchase = {
  id: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  product: {
    title: string;
  };
  createdAt: Date;
};

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get current date and timestamps for time-based queries
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    const twoMonthsAgo = new Date(oneMonthAgo);
    twoMonthsAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    // Fetch all required data
    const [
      totalProducts,
      newProductsThisWeek,
      totalUsers,
      newUsersThisMonth,
      currentMonthSales,
      previousMonthSales,
      currentMonthOrders,
      previousMonthOrders,
      recentActivity,
    ] = await Promise.all([
      // Total products
      prismadb.product.count(),
      
      // New products this week
      prismadb.product.count({
        where: {
          createdAt: { gte: oneWeekAgo }
        }
      }),
      
      // Total users
      prismadb.user.count(),
      
      // New users this month
      prismadb.user.count({
        where: {
          emailVerified: { gte: oneMonthAgo }
        }
      }),
      
      // Current month sales
      prismadb.purchase.aggregate({
        _sum: {
          amount: true
        },
        where: {
          createdAt: {
            gte: oneMonthAgo
          },
          status: "completed"
        }
      }),
      
      // Previous month sales
      prismadb.purchase.aggregate({
        _sum: {
          amount: true
        },
        where: {
          createdAt: {
            gte: twoMonthsAgo,
            lt: oneMonthAgo
          },
          status: "completed"
        }
      }),
      
      // Current month orders count
      prismadb.purchase.count({
        where: {
          createdAt: {
            gte: oneMonthAgo
          },
          status: "completed"
        }
      }),
      
      // Previous month orders count
      prismadb.purchase.count({
        where: {
          createdAt: {
            gte: twoMonthsAgo,
            lt: oneMonthAgo
          },
          status: "completed"
        }
      }),
      
      // Recent activity
      prismadb.purchase.findMany({
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
      })
    ]);

    // Calculate percentage changes
    const currentMonthSalesTotal = currentMonthSales._sum.amount?.toNumber() || 0;
    const prevMonthSalesTotal = previousMonthSales._sum.amount?.toNumber() || 0;
    
    const salesPercentChange = prevMonthSalesTotal > 0 
      ? ((currentMonthSalesTotal - prevMonthSalesTotal) / prevMonthSalesTotal) * 100 
      : 0;
    
    const currentAvgOrderValue = currentMonthOrders > 0 
      ? currentMonthSalesTotal / currentMonthOrders 
      : 0;
    
    const prevAvgOrderValue = previousMonthOrders > 0 
      ? prevMonthSalesTotal / previousMonthOrders 
      : 0;
    
    const avgOrderValuePercentChange = prevAvgOrderValue > 0 
      ? ((currentAvgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 
      : 0;

    // Transform recent activity data
    const formattedActivity = recentActivity.map((purchase: Purchase) => ({
      id: purchase.id,
      type: 'purchase',
      user: {
        id: purchase.user.id,
        name: purchase.user.name || 'Anonymous User',
        image: purchase.user.image
      },
      productName: purchase.product.title,
      timestamp: purchase.createdAt
    }));

    // Return the formatted dashboard data
    return NextResponse.json({
      totalProducts,
      newProductsThisWeek,
      totalUsers,
      newUsersThisMonth,
      totalSales: currentMonthSalesTotal,
      salesPercentChange,
      avgOrderValue: currentAvgOrderValue,
      avgOrderValuePercentChange,
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}

async function getRecentActivity() {
  // Get recent orders
  const recentOrders = await prismadb.order.findMany({
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
  const recentRegistrations = await prismadb.user.findMany({
    take: 5,
    orderBy: {
      emailVerified: 'desc'
    },
    where: {
      emailVerified: { not: null }
    },
    select: {
      id: true,
      name: true,
      image: true,
      emailVerified: true
    }
  });
  
  // Get recent reviews
  const recentReviews = await prismadb.review.findMany({
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
      timestamp: user.emailVerified,
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