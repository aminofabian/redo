import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, isGuestCheckout = false, guestEmail = null } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid items format or empty cart' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle user identification
    let userId = null;
    
    if (isGuestCheckout) {
      if (!guestEmail) {
        return new Response(
          JSON.stringify({ error: 'Guest email is required for guest checkout' }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Check if a temporary user with this email already exists
      let guestUser = await prisma.user.findUnique({
        where: { email: guestEmail }
      });
      
      // If not, create a temporary user account with this email
      if (!guestUser) {
        guestUser = await prisma.user.create({
          data: {
            email: guestEmail,
            role: 'GUEST',
            name: 'Guest User'
          }
        });
      }
      
      userId = guestUser.id;
    } else {
      // Get user ID if not a guest checkout
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return new Response(
          JSON.stringify({ error: 'Authentication required' }), 
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      userId = session.user.id;
    }
    
    // Fetch product information to get actual prices
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true, finalPrice: true }
    });
    
    if (products.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid products found' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      const product = products.find(p => p.id === item.productId);
      return sum + (product ? (product.finalPrice || product.price) * item.quantity : 0);
    }, 0);
    
    // Create the order
    const order = await prisma.order.create({
      data: {
        userId, // This is now always set
        status: 'PENDING',
        totalAmount,
        // Store additional guest info in metadata
        metadata: isGuestCheckout ? { isGuestCheckout: true, guestEmail } : undefined,
        orderItems: {
          create: items.map(item => {
            const product = products.find(p => p.id === item.productId);
            const price = product ? (product.finalPrice || product.price) : 0;
            return {
              productId: item.productId,
              quantity: item.quantity,
              price
            };
          })
        }
      }
    });
    
    return new Response(
      JSON.stringify({ 
        orderId: order.id,
        totalAmount: totalAmount.toString(),
        isGuestCheckout
      }), 
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create order', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
