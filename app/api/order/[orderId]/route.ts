// api/order/[orderId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

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

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    });
    
    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({
        id: order.id,
        finalPrice: order.totalAmount.toString(),
        productIds: order.orderItems.map(item => item.productId.toString()),
        items: order.orderItems.map(item => ({
          id: item.id,
          productId: item.productId,
          title: item.product.title,
          quantity: item.quantity,
          price: item.price
        }))
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error fetching order:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch order' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
