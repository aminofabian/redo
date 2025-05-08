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
    
    // Get the authenticated user
    const authSession = await getAuthSession();
    if (!authSession?.user || !authSession.user.id) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    
    // Now TypeScript knows user cannot be null for the rest of the function
    const userId = authSession.user.id;
    
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

    // Find the order in our database using the Stripe session ID as payment intent ID
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId: sessionId,
        userId: userId
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Prepare transaction data
    const transactionData = {
      amount: order.totalAmount,
      currency: order.currency,
      status: 'completed',
      gatewayId: process.env.STRIPE_GATEWAY_ID || 'stripe', // Use configured gateway ID
      externalReference: stripeSession.payment_intent as string,
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

      // 2. Update the order status
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paymentStatus: 'paid',
          transactionId: transaction.id
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

        const purchase = await tx.purchase.create({
          data: {
            productId: item.productId,
            userId: userId,
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