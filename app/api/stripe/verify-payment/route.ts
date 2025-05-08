// app/api/stripe/verify-payment/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/getAuthSession";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

// POST is more appropriate for actions that change state
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID is required" },
        { status: 400 }
      );
    }
    
    // Get the authenticated user (if available)
    const authSession = await getAuthSession();
    let userId = authSession?.user?.id;
    
    // If we don't have a userId from the session, we'll try to find the order by sessionId only
    // This allows the verification to work even if the user is not authenticated during the redirect
    
    // Retrieve the Stripe session
    const stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product', 'customer_details', 'payment_intent'],
    });

    if (stripeSession.payment_status !== 'paid') {
      return NextResponse.json(
        { success: false, message: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get order ID from the Stripe session metadata
    // Stripe puts the metadata we set during checkout session creation here
    const orderId = stripeSession.metadata?.orderId;
    
    if (!orderId) {
      return NextResponse.json(
        { success: false, message: "No order ID found in session metadata" },
        { status: 400 }
      );
    }
    
    console.log("Looking for order with ID:", orderId);
    
    // Find the order in our database using the orderId from session metadata
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        ...(userId ? { userId } : {})
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        },
        user: true // Include user to get userId if not authenticated
      }
    });
    
    console.log("Order found:", order ? "Yes" : "No");

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }
    
    // If we didn't have userId from session, get it from the order
    userId = userId || order.user.id;

    // Get the payment intent ID from the Stripe session
    const paymentIntentId = stripeSession.payment_intent as string;
    console.log("Payment Intent ID:", paymentIntentId);
    
    // Prepare transaction data
    const transactionData = {
      amount: order.totalAmount,
      currency: order.currency,
      status: 'completed',
      gatewayId: process.env.STRIPE_GATEWAY_ID || 'stripe', // Use configured gateway ID
      externalReference: paymentIntentId,
      purchaseId: null, // Will update this after creating purchases
      userId: userId,
      completedAt: new Date(),
      metadata: {
        stripeSessionId: sessionId,
        paymentMethod: 'card', // Assuming card payment through Stripe
      }
    };

    // Begin a transaction to ensure all updates happen together
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the transaction record
      const transaction = await tx.transaction.create({
        data: transactionData
      });

      // 2. Update the order status with transaction ID and payment intent ID
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paymentStatus: 'paid',
          transactionId: transaction.id,
          paymentIntentId: paymentIntentId // Store the payment intent ID in the order
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });

      // 3. Create purchase records for each product
      const purchases = [];
      for (const item of order.orderItems) {
        // Calculate access expiry if the product has an access duration
        let accessExpires = null;
        if (item.product.accessDuration) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + item.product.accessDuration);
          accessExpires = expiryDate;
        }

        // At this point, userId should be defined from order.user.id if it wasn't from the session
        // But we'll add a safety check to satisfy TypeScript
        if (!userId) {
          throw new Error("User ID is required for purchase creation");
        }
        
        const purchase = await tx.purchase.create({
          data: {
            productId: item.productId,
            userId: userId, // Now userId is guaranteed to be defined
            amount: item.price,
            accessExpires,
            downloadsLeft: item.product.downloadLimit,
            status: 'completed',
          }
        });
        purchases.push(purchase);
      }

      // 4. Update transaction with the first purchase ID (if any)
      if (purchases.length > 0) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: { purchaseId: purchases[0].id }
        });
      }

      return { updatedOrder, purchases };
    });

    // Format the response for the success page
    const orderDetails = {
      id: result.updatedOrder.id,
      totalAmount: Number(result.updatedOrder.totalAmount),
      items: result.updatedOrder.orderItems.map(item => ({
        id: item.id,
        title: item.product.title,
        price: Number(item.price),
        quantity: item.quantity,
        downloadAvailable: Boolean(item.product.downloadUrl)
      }))
    };

    return NextResponse.json({
      success: true,
      message: "Payment verified and order processed successfully",
      orderId: result.updatedOrder.id,
      orderDetails
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { success: false, message: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

// Keep GET endpoint for backward compatibility
export async function GET(request: Request) {
  return NextResponse.json(
    { success: false, message: "Please use POST method for payment verification" },
    { status: 405 }
  );
}