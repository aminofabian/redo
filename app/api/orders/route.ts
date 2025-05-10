import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withAuth } from "@/auth";
import { safeJSONStringify } from '@/lib/json-utils';
import { Prisma } from '@prisma/client';

type OrderItem = {
  id: string;
  productId: bigint;
  quantity: number;
  price: Prisma.Decimal | number;
  product: {
    title: string;
    images: {
      url: string;
      isPrimary: boolean;
    }[];
  };
}

type OrderWithRelations = {
  id: string;
  userId: string;
  status: string;
  totalAmount: Prisma.Decimal | number;
  currency: string;
  paymentStatus: string;
  createdAt: Date;
  updatedAt: Date;
  orderItems: OrderItem[];
}

export async function POST(request: NextRequest) {
  try {
    return withAuth(request, async (req, session) => {
      // Only allow authorized users to create orders for themselves
      const userId = session.user.id;
      
      const data = await request.json();
      
      // Validate required fields
      if (!data.orderItems || !data.orderItems.length) {
        return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
      }
      
      // Calculate total amount from order items
      let totalAmount = 0;
      
      // Prepare order items with proper data
      const orderItems = await Promise.all(
        data.orderItems.map(async (item: { productId: string; quantity: number }) => {
          // Get product details to ensure price is accurate
          const product = await prisma.product.findUnique({
            where: { id: BigInt(item.productId) },
            select: { finalPrice: true }
          });
          
          if (!product) {
            throw new Error(`Product with ID ${item.productId} not found`);
          }
          
          const itemTotal = Number(product.finalPrice) * item.quantity;
          totalAmount += itemTotal;
          
          return {
            productId: BigInt(item.productId),
            quantity: item.quantity,
            price: product.finalPrice
          };
        })
      );
      
      // Create the order with items in a transaction
      const order = await prisma.$transaction(async (tx) => {
        // Create the main order
        const newOrder = await tx.order.create({
          data: {
            userId,
            status: data.status || 'pending',
            totalAmount,
            currency: data.currency || 'USD',
            paymentStatus: data.paymentStatus || 'unpaid',
            metadata: data.metadata,
            orderItems: {
              create: orderItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
              }))
            }
          },
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    title: true,
                    images: {
                      where: {
                        isPrimary: true
                      },
                      take: 1,
                      select: {
                        url: true,
                        isPrimary: true
                      }
                    }
                  }
                }
              }
            }
          }
        });
        
        return newOrder;
      });
      
      // Use safeJSONStringify to handle BigInt values
      const serializedOrder = JSON.parse(safeJSONStringify(order));
      return NextResponse.json(serializedOrder);
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, session) => {
    try {
      // Parse query parameters
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '10');
      const userId = session.user.id;
      const status = searchParams.get('status');
      
      // Prepare filter
      const where: any = { userId };
      
      // Add status filter if provided
      if (status) {
        where.status = status;
      }
      
      // Fetch orders with items
      const orders = await prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  title: true,
                  images: {
                    where: {
                      isPrimary: true
                    },
                    take: 1,
                    select: {
                      url: true,
                      isPrimary: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit
      });
      
      // Transform for easier frontend use
      const formattedOrders = orders.map((order: OrderWithRelations) => ({
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: formatPrice(order.totalAmount),
        createdAt: formatDate(order.createdAt),
        orderItems: order.orderItems.map(item => ({
          id: item.id,
          productId: item.productId.toString(), // Convert BigInt to string
          quantity: item.quantity,
          price: formatPrice(item.price),
          productTitle: item.product.title,
          productImage: item.product.images[0]?.url || null
        })),
        itemCount: order.orderItems.length
      }));
      
      // Use safeJSONStringify to handle BigInt values
      const serializedOrders = JSON.parse(safeJSONStringify(formattedOrders));
      return NextResponse.json(serializedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      );
    }
  });
}

// Helper functions
function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatPrice(price: any): string {
  return `$${Number(price).toFixed(2)}`;
}
