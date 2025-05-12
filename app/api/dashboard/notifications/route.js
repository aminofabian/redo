import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PrismaClient } from '@prisma/client';

// Set dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

// Using global singleton for PrismaClient to prevent connection issues
const globalForPrisma = global;
globalForPrisma.prisma = globalForPrisma.prisma || new PrismaClient();
const prisma = globalForPrisma.prisma;

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}

// Handler for GET requests
export async function GET(request) {
  try {
    const session = await auth();

    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Since we don't have a dedicated notifications table in the schema,
    // we'll generate notifications based on user activity
    
    // Get recent purchases to create notifications
    const recentPurchases = await prisma.purchase.findMany({
      where: {
        userId,
      },
      include: {
        product: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 2,
    });
    
    // Get recent orders for notifications
    const recentOrders = await prisma.order.findMany({
      where: {
        userId,
        paymentStatus: 'unpaid',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1,
    });
    
    // Generate notifications from activity data
    const notifications = [];
    
    // Add purchase notifications
    recentPurchases.forEach((purchase, index) => {
      notifications.push({
        id: `purchase-${purchase.id}`,
        title: 'New material available',
        message: `${purchase.product.title} is now available in your dashboard`,
        time: getTimeAgo(purchase.createdAt),
        read: index > 0, // Mark first as unread
        type: 'info',
      });
    });
    
    // Add order notifications
    recentOrders.forEach(order => {
      notifications.push({
        id: `order-${order.id}`,
        title: 'Pending payment',
        message: `You have an unpaid order of $${order.totalAmount}`,
        time: getTimeAgo(order.createdAt),
        read: false,
        type: 'warning',
      });
    });
    
    // Add a welcome notification if user has few or no purchases
    if (recentPurchases.length < 2) {
      notifications.push({
        id: 'welcome',
        title: 'Welcome to the dashboard',
        message: 'Explore our resources and start learning today',
        time: '1 day ago',
        read: true,
        type: 'success',
      });
    }
    
    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}