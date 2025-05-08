import Stripe from "stripe";
import { NextResponse } from 'next/server';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

export async function POST(request: Request) {
  try {
    const { cartItems,orderId } = await request.json();
    const returnUrl = "rnstudentresources.vercel.app"

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json(
        { error: "cartItems must be an array" },
        { status: 400 }
      );
    }



    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      };
    interface CartItem {
      id: number;
      title: string;
      price: number;
      quantity: number;
      image?: string;
    }

    interface LineItem {
      price_data: {
        currency: string;
        product_data: {
          name: string;
          images?: string[];
        };
        unit_amount: number;
      };
      quantity: number;
    }

    const line_items: LineItem[] = cartItems.map((item: CartItem) => {
      const lineItem: LineItem = {
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title || "Product",
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      };

      if (item.image) {
        lineItem.price_data.product_data.images = [item.image];
      }

      return lineItem;
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
    //   success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
    //   success_url: `${returnUrl || request.headers.get('origin') || ''}/success?session_id={CHECKOUT_SESSION_ID}`,
      success_url: `rnstudentresources.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
       cancel_url: `rnstudentresources.vercel.app/cancel`,
       metadata: {
        orderId, 
      },
    });

    return NextResponse.json({ sessionId: session.id, headers });

  } catch (error) {
    console.error("Error creating Stripe session:", error);
    return NextResponse.json(
      { error: "Failed to create Stripe session" },
      { status: 500 }
    );
  }
}