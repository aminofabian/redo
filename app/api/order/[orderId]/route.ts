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
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;
    
    // Try to fetch the order items first, separately from products
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true, // Get order items without products first
      },
    });

    if (!order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Now fetch products individually and handle missing ones
    const orderItemsWithProducts = await Promise.all(
      order.orderItems.map(async (item) => {
        try {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
          });
          
          return {
            ...item,
            product: product || {
              id: item.productId,
              title: "Product no longer available",
              description: "",
              price: item.price,
              finalPrice: item.price,
              // Add other required fields with default values
            }
          };
        } catch (error) {
          console.error(`Error fetching product for order item ${item.id}:`, error);
          return {
            ...item,
            product: {
              id: item.productId,
              title: "Product no longer available",
              description: "",
              price: item.price,
              finalPrice: item.price,
              // Add other required fields with default values
            }
          };
        }
      })
    );

    const orderWithProducts = {
      ...order,
      orderItems: orderItemsWithProducts,
    };

    // Convert BigInt values to strings to prevent serialization issues
    const serializedOrder = JSON.parse(JSON.stringify(orderWithProducts, (key, value) => 
      typeof value === 'bigint' ? value.toString() : value
    ));

    // Prepare the response with the data you need
    const response = {
      finalPrice: serializedOrder.totalAmount,
      productIds: serializedOrder.orderItems.map((item: any) => item.productId),
      orderItems: serializedOrder.orderItems,
      status: serializedOrder.status,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching order:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch order', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
