// api/order/[orderId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: session.user.id, // important for security (only owner sees)
      },
      include: {
        orderItems: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const finalPrice = order.orderItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    console.log(finalPrice, 'final priceeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    const productIds = order.orderItems.map(item => item.productId);

    return NextResponse.json({ finalPrice, productIds });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
