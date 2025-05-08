// api/order/[orderId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { auth } from '@/lib/auth';

// Modified version of the JSON.stringify function that can handle BigInt
function safeJSONStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) => {
    // Check if the value is a BigInt and convert it to a string
    if (typeof value === 'bigint') {
      return value.toString(); 
    }
    // Otherwise, return the value as is
    return value;
  });
}

// Function to create a custom NextResponse with BigInt handling
function safeNextResponse(data: any, options: any = {}) {
  const body = safeJSONStringify(data);
  return new NextResponse(body, {
    ...options,
    headers: {
      ...options.headers,
      'content-type': 'application/json',
    },
  });
}

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return safeNextResponse({ error: 'Unauthorized' }, { status: 401 });
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
      return safeNextResponse({ error: 'Order not found' }, { status: 404 });
    }

    const finalPrice = order.orderItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    console.log(finalPrice, 'final priceeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee');
    
    // Safe mapping of product IDs
    const productIds = order.orderItems.map(item => {
      // Convert any type of productId to string safely
      return String(item.productId || '');
    });
    
    // Return BigInt-safe response using our helper function
    return safeNextResponse({ finalPrice, productIds });
  } catch (error) {
    console.error('Error fetching order:', error);
    return safeNextResponse(
      { 
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
