// app/api/stripe/verify-payment/route.ts
import Stripe from "stripe";
import { NextResponse } from 'next/server';

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
    console.log(sessionId, 'this is the session id, you get it')

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer_details', 'payment_intent'],
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const orderData = {
      id: session.id,
      payment_intent: session.payment_intent,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_details: session.customer_details,
      items: session.line_items?.data,
      payment_status: session.payment_status,
      created: session.created,
    };

    

    return NextResponse.json(orderData);
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}