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

    // Get total number of orders
    const totalOrders = await prisma.order.count({
      where: {
        userId,
      },
    });

    // Get number of unpaid orders (orders with status 'pending' or 'unpaid')
    const unpaidOrders = await prisma.order.count({
      where: {
        userId,
        paymentStatus: 'unpaid',
      },
    });

    // Get number of completed orders (orders with transaction)
    const completedOrders = await prisma.order.count({
      where: {
        userId,
        transactionId: {
          not: null,
        },
        transaction: {
          status: 'completed',
        },
      },
    });

    // Get total amount spent from completed transactions
    const totalSpent = await prisma.transaction.aggregate({
      where: {
        orders: {
          some: {
            userId,
          },
        },
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    // Get current items in cart (count of order items with status 'pending')
    const coursesInCart = await prisma.orderItem.count({
      where: {
        order: {
          userId,
          paymentStatus: 'unpaid',
        },
      },
    });

    // Return all stats in a JSON response
    return NextResponse.json({
      totalOrders,
      unpaidOrders,
      completedOrders,
      totalSpent: totalSpent._sum.amount || 0,
      coursesInCart,
    });
  } catch (error) {
    console.error('Error fetching user order stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order statistics' },
      { status: 500 }
    );
  }
}