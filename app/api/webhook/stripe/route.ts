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
    

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(session.customer_details, 'Customer details from the session:')
      
      const { 
        id: sessionId,
        payment_intent: paymentIntentId,
        amount_total: amountTotal,
        currency,
        payment_status: paymentStatus,
        customer_details,
        metadata
      } = session;

     

      const orderId = session.metadata?.orderId || session.client_reference_id;
      if (!orderId) {
        return NextResponse.json({ error: "Order ID not found in session" }, { status: 400 });
      }
      
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

     

      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const transaction = await prisma.transaction.create({
        data: {
          amount: amountTotal ? amountTotal / 100 : order.totalAmount, 
          currency: currency || order.currency,
          status: paymentStatus === 'paid' ? 'completed' : 'failed',
          paymentMethod: 'stripe',
          paymentType: 'one-time',
          gatewayId: 'stripe',
          gatewayTransactionId: paymentIntentId as string,
          gatewayCustomerId: order.userId,
          receiptEmail: customer_details?.email || order.user?.email,
          orders: { connect: { id: order.id } },
          metadata: JSON.parse(JSON.stringify(session)), 
        },
      });

      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: paymentStatus === 'paid' ? 'paid' : 'failed',
          paymentStatus: paymentStatus === 'paid' ? 'paid' : 'failed',
          paymentIntentId: paymentIntentId as string,
          transactionId: transaction.id,
        },
      });

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

    return NextResponse.json({ received: true });

  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook handler failed', details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
}