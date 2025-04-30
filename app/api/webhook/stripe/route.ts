import Stripe from "stripe";
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: "No Stripe signature found in request" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
    }
    console.log(event, 'this is the event from stripe webhook::::::::::::::::::::::::::::::::::::::::::::::');

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(session.customer_details, 'Customer details from the session:')
      
      // Extract relevant data from the session (matching your callback data)
      const { 
        id: sessionId,
        payment_intent: paymentIntentId,
        amount_total: amountTotal,
        currency,
        payment_status: paymentStatus,
        customer_details,
        metadata
      } = session;

      console.log({
        id: sessionId,
        payment_intent: paymentIntentId,
        amount_total: amountTotal,
        currency,
        payment_status: paymentStatus,
        customer_details,
        metadata,

        
      }, "///////////////////////////////////////////////////////////////sdkfjkj")

      // Get your internal orderId from metadata or client_reference_id
      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (!orderId) {
        return NextResponse.json({ error: "Order ID not found in session" }, { status: 400 });
      }
      console.log(orderId, 'this is the order id from the sessionsssssssssssssss');

      // Find the order with order items and user
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { 
          user: true,
          orderItems: {
            include: {
              product: true
            }
          }
        },
      });

      console.log(order, 'this is the order from the database::::::::::::::::::::::::::::::::::::::::::::::');

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      // Create transaction (similar to PayPal logic)
      const transaction = await prisma.transaction.create({
        data: {
          amount: amountTotal ? amountTotal / 100 : order.totalAmount, // Convert from cents to dollars if amountTotal exists
          currency: currency || order.currency,
          status: paymentStatus === 'paid' ? 'completed' : 'failed',
          paymentMethod: 'stripe',
          paymentType: 'one-time',
          gatewayId: 'stripe',
          gatewayTransactionId: paymentIntentId as string,
          gatewayCustomerId: order.userId,
          receiptEmail: customer_details?.email || order.user?.email,
          orders: { connect: { id: order.id } },
          metadata: JSON.parse(JSON.stringify(session)), // Store the session for reference
        },
      });

      console.log(transaction, 'transactionsssssssssssssss...............:')
      // Update order status (similar to PayPal logic)
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: paymentStatus === 'paid' ? 'paid' : 'failed',
          paymentStatus: paymentStatus === 'paid' ? 'paid' : 'failed',
          paymentIntentId: paymentIntentId as string,
          transactionId: transaction.id,
        },
      });

      // If payment was successful, create purchases for each order item
      if (paymentStatus === 'paid') {
        for (const item of order.orderItems) {
          await prisma.purchase.create({
            data: {
              product: { connect: { id: item.productId } },
              user: { connect: { id: order.userId } },
              amount: item.price,
              status: 'completed',
              transactions: { connect: { id: transaction.id } },
            },
          });
        }
      }

      return NextResponse.json({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        transactionId: transaction.id,
        sessionId: session.id,
        paymentStatus: session.payment_status,
      });
    }

    // Handle other events as needed
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Error in Stripe webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}