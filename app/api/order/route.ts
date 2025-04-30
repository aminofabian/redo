import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = await request.json();
    console.log('Items received:', items);

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items format' }, { status: 400 });
    }

    // Fetch the actual product data to get real prices
    const productIds = items.map((item: { productId: number }) => item.productId);
    console.log(productIds, 'product idsssssssssssssssssssssssssssssssssss');

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        finalPrice: true,
      },
    });

    if (products.length !== items.length) {
      return NextResponse.json({ error: 'Some products not found' }, { status: 400 });
    }

    // Create order with associated orderItems
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        totalAmount: products.reduce((sum, product) => {
          const item = items.find((i) => i.productId === product.id);
          return sum + (item ? item.quantity * Number(product.finalPrice) : 0);
        }, 0),
        orderItems: {
          create: items.map((item: { productId: number; quantity: number }) => {
            const product = products.find((p) => p.id === item.productId);
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: product ? product.finalPrice : 0,
            };
          }),
        },
      },
      include: {
        orderItems: true,
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
