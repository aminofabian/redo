// app/api/order/count/route.ts
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

    const userId = session.user.id;

    // Get total number of orders
    const totalOrders = await prisma.order.count({
      where: {
        userId,
      },
    });

    console.log(totalOrders, 'total orders');
    // Get number of unpaid orders (orders with status 'pending' or 'unpaid')
    const unpaidOrders = await prisma.order.count({
      where: {
        userId,
        paymentStatus: 'unpaid',
      },
    });

    console.log(unpaidOrders, 'unpaid orders');

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

    console.log(completedOrders, 'completed orders');

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