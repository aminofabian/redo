import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/auth';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

// Add this type at the top of your file
type SessionUser = {
  user?: {
    id: string;
    email?: string;
    name?: string;
  };
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, isGuestCheckout = false, userEmail = null } = body;
    
    // Validate cart items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid items format or empty cart' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Handle user identification
    let userId = null;
    
    // First, try to get the user ID from the session
    try {
      const session = await getServerSession(authOptions) as SessionUser;
      
      if (session?.user?.id) {
        userId = session.user.id;
        console.log(`Found authenticated user ID: ${userId}`);
      }
    } catch (error) {
      console.error("Session error:", error);
    }
    
    // If we couldn't get a user ID from the session but have an email, try to find/create user
    if (!userId && userEmail) {
      console.log(`No userId from session, trying to find user by email: ${userEmail}`);
      
      let user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (!user) {
        if (isGuestCheckout) {
          console.log(`Creating new guest user with email: ${userEmail}`);
          user = await prisma.user.create({
            data: {
              email: userEmail,
              role: 'GUEST',
              name: 'Guest User'
            }
          });
        } else {
          return new Response(
            JSON.stringify({ error: 'User not found with provided email' }), 
            { status: 401, headers: { 'Content-Type': 'application/json' } }
          );
        }
      }
      
      userId = user.id;
      console.log(`Using user ID ${userId} found/created from email`);
    }
    
    // If we still don't have a userId, we can't proceed
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required - no valid user found' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Now proceed with the order creation
    console.log(`Creating order with user ID: ${userId}`);
    
    // Fetch product information to get actual prices
    const productIds = items.map(item => {
      // Ensure productId is treated as a BigInt
      // First convert to string to handle any potential type issues
      const idStr = String(item.productId);
      
      // Debug what IDs we're looking for
      console.log(`Looking up product ID: ${idStr}`);
      
      try {
        // Parse as BigInt if your database expects it
        return BigInt(idStr);
      } catch (e) {
        console.error(`Invalid product ID format: ${idStr}`, e);
        // Return the original ID as fallback
        return item.productId;
      }
    });

    console.log("Product IDs to look up:", productIds);

    try {
      const products = await prisma.product.findMany({
        where: { 
          id: { 
            in: productIds.map(id => typeof id === 'bigint' ? id : BigInt(String(id)))
          } 
        },
        select: { id: true, price: true, finalPrice: true, title: true }
      });
      
      console.log(`Found ${products.length} products`, products.map(p => ({id: p.id.toString(), title: p.title})));
      
      if (products.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'No valid products found', 
            lookedFor: productIds.map(id => String(id)),
            debug: items
          }), 
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => {
        // Use string comparison for BigInt IDs
        const product = products.find(p => p.id.toString() === item.productId.toString());
        
        if (!product) return sum;
        
        // Convert values to numbers to ensure they're numeric
        const price = Number(product.finalPrice || product.price);
        const quantity = Number(item.quantity);
        
        return sum + (price * quantity);
      }, 0);
      
      // Create the order
      const order = await prisma.order.create({
        data: {
          userId, // This is now always set
          status: 'PENDING',
          totalAmount,
          // Store additional guest info in metadata
          metadata: isGuestCheckout ? { isGuestCheckout: true, userEmail } : undefined,
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
      console.error("Product lookup error:", error);
      return new Response(
        JSON.stringify({ 
          error: 'Product lookup error', 
          details: error instanceof Error ? error.message : String(error),
          productIds: productIds.map(id => String(id))
        }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
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
