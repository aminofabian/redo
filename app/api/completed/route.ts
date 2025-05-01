import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/src/generated/client';
import { auth } from '@/lib/auth';


const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get userId from the query parameters
    const session = await auth();
    
        if (!session?.user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

    const completedOrders = await getUserCompletedOrders(session.user.id);

    return NextResponse.json({
      orders: completedOrders
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return NextResponse.json({ message: 'Error fetching order data' }, { status: 500 });
  }
}

async function getUserCompletedOrders(userId: string) {
  return await prisma.order.findMany({
    where: {
      userId,
      transaction: {
        status: 'completed',
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              // Add more fields as needed
              // title: true,
              // imageUrl: true,
            },
          },
        },
      },
      transaction: {
        select: {
          status: true,
          completedAt: true,
          amount: true,
          currency: true,
        },
      },
    },
  });
}
