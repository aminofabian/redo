// app/api/stripe/verify-order/route.ts
import Stripe from "stripe";
import { NextResponse } from 'next/server';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const orderId = searchParams.get('order_id');
    
    console.log(`Verifying order: Session ID = ${sessionId}, Order ID = ${orderId}`);

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Retrieve the session to get payment details
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details', 'payment_intent'],
    });

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // If order_id was provided, find that specific order
    let order;
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          // items: true, // Removed as it does not exist in OrderInclude type
          user: true,
          transaction: true
        }
      });
    } else {
      // Try to find the order by session ID in metadata
      order = await prisma.order.findFirst({
        where: {
          metadata: {
            path: ['sessionId'],
            equals: sessionId
          }
        },
        include: {
          // items: true, // Removed as it does not exist in OrderInclude type
          user: true,
          transaction: true
        }
      });
    }

    // If we couldn't find an order, that's ok - the webhook might not have processed yet
    if (!order) {
      console.log('Order not found, providing session details only');
      
      // Extract relevant order information from the session
      const orderData = {
        id: session.id,
        payment_intent: session.payment_intent,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_details: session.customer_details,
        items: session.line_items?.data,
        payment_status: session.payment_status,
        created: session.created,
        message: "Order details are being processed. The webhook may not have completed yet."
      };

      return NextResponse.json(orderData);
    }

    // Return the combined order and payment information
    return NextResponse.json({
      order: {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        currency: order.currency,
        // Removed 'items' as it does not exist on the 'order' object
        created: order.createdAt,
      },
      payment: {
        transactionId: order.transactionId,
        paymentIntentId: session.payment_intent,
        amount: session.amount_total,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_details?.email,
      }
    });
  } catch (error) {
    console.error("Error verifying order:", error);
    return NextResponse.json(
      { error: "Failed to verify order" },
      { status: 500 }
    );
  }
}