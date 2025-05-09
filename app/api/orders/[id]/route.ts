import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from "@/auth";
import { safeJSONStringify } from '@/lib/json-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async (req, session) => {
    try {
      const { id } = params;
      
      // Fetch the order with its items
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  finalPrice: true,
                  images: {
                    select: {
                      id: true,
                      url: true,
                      isPrimary: true
                    }
                  }
                }
              }
            }
          },
          transaction: {
            select: {
              id: true,
              status: true,
              completedAt: true,
              amount: true,
              paymentMethod: true
            }
          }
        }
      });
      
      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      
      // Security check: Only allow users to access their own orders
      // unless they have admin role
      if (order.userId !== session.user.id && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
      
      // Format the order data for frontend
      const formattedOrder = {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: `$${Number(order.totalAmount).toFixed(2)}`,
        currency: order.currency,
        createdAt: order.createdAt.toISOString(),
        formattedDate: formatDate(order.createdAt),
        items: order.orderItems.map(item => ({
          id: item.id,
          productId: item.productId.toString(),
          quantity: item.quantity,
          price: `$${Number(item.price).toFixed(2)}`,
          product: {
            id: item.product.id.toString(),
            title: item.product.title,
            description: item.product.description,
            price: `$${Number(item.product.finalPrice).toFixed(2)}`,
            mainImage: item.product.images.find(img => img.isPrimary)?.url || 
                      (item.product.images[0]?.url || null)
          }
        })),
        transaction: order.transaction ? {
          id: order.transaction.id,
          status: order.transaction.status,
          amount: `$${Number(order.transaction.amount).toFixed(2)}`,
          completedAt: order.transaction.completedAt?.toISOString() || null,
          paymentMethod: order.transaction.paymentMethod || 'Unknown'
        } : null,
        itemCount: order.orderItems.length
      };
      
      // Use safeJSONStringify to handle BigInt values
      const serializedOrder = JSON.parse(safeJSONStringify(formattedOrder));
      return NextResponse.json(serializedOrder);
    } catch (error) {
      console.error('Error fetching order details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch order details' },
        { status: 500 }
      );
    }
  });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}
