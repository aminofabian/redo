import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

// Helper function to format dates as relative time strings
function getRelativeTimeString(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSecs = Math.floor(diffInMs / 1000);
  const diffInMins = Math.floor(diffInSecs / 60);
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  
  if (diffInSecs < 60) {
    return 'just now';
  } else if (diffInMins < 60) {
    return `${diffInMins}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  } else {
    // Format the date for older items
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
}

export const GET = async () => {
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

    // Get sales statistics - only include paid orders
    const totalSales = await prisma.order.aggregate({
      where: {
        paymentStatus: "paid"
      },
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
        },
        paymentStatus: "paid"
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
        },
        paymentStatus: "paid"
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

    // Calculate average order value - only for paid orders
    const orderCount = await prisma.order.count({
      where: {
        paymentStatus: "paid"
      }
    });
    const avgOrderValue = orderCount === 0 
      ? 0 
      : Number(totalSales._sum.totalAmount || 0) / orderCount;

    // Calculate average order value percent change
    const currentMonthOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: currentMonth
        },
        paymentStatus: "paid"
      }
    });

    const previousMonthOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: previousMonth,
          lt: currentMonth
        },
        paymentStatus: "paid"
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

    // Get recent activity using real data but with proper error handling
    let activityItems: any[] = [];
    
    // Get recent orders (without requiring user relation)
    try {
      const recentOrders = await prisma.order.findMany({
        take: 5, // Take more to ensure we get enough after filtering
        orderBy: {
          createdAt: 'desc'
        },
        where: {
          paymentStatus: "paid"
        },
        select: {
          id: true,
          createdAt: true,
          userId: true
        }
      });

      // Get recent activity using real data but with proper error handling
      let activityItems: any[] = [];
      
      // Get recent orders (without requiring user relation)
      try {
        const recentOrders = await prisma.order.findMany({
          take: 5, // Take more to ensure we get enough after filtering
          orderBy: {
            createdAt: 'desc'
          },
          where: {
            paymentStatus: "paid"
          },
          select: {
            id: true,
            createdAt: true,
            userId: true
          }
        });
        
        // Process the orders
        for (const order of recentOrders) {
          try {
            // Only process if userId exists
            if (!order.userId) continue;
            
            // Separately fetch user to avoid relation errors
            const user = await prisma.user.findUnique({
              where: { id: order.userId },
              select: {
                id: true,
                name: true,
                image: true
              }
            });
            
            // Only add if user was found
            if (!user) continue;
            
            // Get first order item
            const orderItem = await prisma.orderItem.findFirst({
              where: { orderId: order.id },
              include: {
                product: {
                  select: {
                    title: true
                  }
                }
              }
            });
            
            activityItems.push({
              id: order.id,
              type: 'purchase',
              user: {
                id: user.id,
                name: user.name || 'Unknown User',
                image: user.image
              },
              productName: orderItem?.product?.title || 'Product',
              timestamp: order.createdAt.toISOString(),
              timeAgo: getRelativeTimeString(order.createdAt)
            });
          } catch (error) {
            console.error(`Error processing order ${order.id}:`, error);
          }
        }
        
        // Get recent registrations
        try {
          // Get recent users with custom fields including createdAt
          const recentRegistrations = await prisma.$queryRaw`
            SELECT id, name, email, image, "emailVerified" as "createdAt"
            FROM "User"
            ORDER BY "emailVerified" DESC
            LIMIT 5
          `;
          
          // Process the raw query results
          if (Array.isArray(recentRegistrations)) {
            activityItems.push(...recentRegistrations.map((user: any) => ({
              id: user.id,
              type: 'registration',
              user: {
                id: user.id,
                name: user.name || 'New User',
                image: user.image
              },
              timestamp: user.createdAt ? user.createdAt.toISOString() : new Date().toISOString(),
              timeAgo: user.createdAt ? getRelativeTimeString(new Date(user.createdAt)) : 'recently'
            })));
          }
        } catch (error) {
          console.error('Error fetching recent registrations:', error);
        }
        
        // Sort by timestamp and take the 5 most recent items
        const recentActivity = activityItems
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 5);

        return NextResponse.json({
          totalOrders: await prisma.order.count(), // Total number of orders
          totalProducts,
          newProductsThisWeek,
          totalUsers,
          newUsersThisMonth,
          totalSales: Number(totalSales._sum.totalAmount || 0),
          salesPercentChange,
          avgOrderValue,
          avgOrderValuePercentChange,
          recentActivity // Combined recent user activity
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
          { error: 'Failed to fetch dashboard stats' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch dashboard stats' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 