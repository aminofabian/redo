import Stripe from "stripe";
import { NextResponse } from 'next/server';

// Helper function to handle BigInt serialization
function safeJSONStringify(obj: any): string {
  return JSON.stringify(obj, (_, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  });
}

// Helper for safe response with BigInt support
function safeNextResponse(data: any, options: any = {}) {
  const body = safeJSONStringify(data);
  return new NextResponse(body, {
    ...options,
    headers: {
      ...options.headers,
      'content-type': 'application/json',
    },
  });
}

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

export const POST = async (request: Request) => {
  try {
    const requestData = await request.json();
    const { cartItems, orderId } = requestData;
    const returnUrl = "https://rnstudentresources.vercel.app";
    
    console.log("Checkout session request data:", JSON.stringify(requestData, null, 2));
    
    if (!cartItems || !Array.isArray(cartItems)) {
      return safeNextResponse(
        { error: "cartItems must be an array" },
        { status: 400 }
      );
    }
    
    if (!orderId) {
      console.error("No orderId provided in checkout session request");
      return safeNextResponse(
        { error: "orderId is required to create a checkout session" },
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

    // Always ensure orderId is safely converted to string if it's a BigInt
    // This prevents "Do not know how to serialize a BigInt" errors
    const safeOrderId = typeof orderId === 'bigint' ? 
      orderId.toString() : 
      (typeof orderId === 'string' ? orderId : String(orderId));
    
    console.log(`Creating Stripe session with orderId: ${safeOrderId} (type: ${typeof orderId})`);
    
    // Double-check we have a valid order ID before proceeding
    if (safeOrderId === 'undefined' || safeOrderId === 'null' || safeOrderId === 'unknown') {
      console.error("Invalid orderId detected before Stripe session creation:", safeOrderId);
      return safeNextResponse(
        { error: "A valid orderId is required to create a checkout session" },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `https://rnstudentresources.vercel.app/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://rnstudentresources.vercel.app/cancel`,
      metadata: {
        orderId: safeOrderId, // Always use the safe string version
      },
    });

    // Use our BigInt-safe response helper
    return safeNextResponse({ sessionId: session.id, headers });

  } catch (error) {
    console.error("Error creating Stripe session:", error);
    return safeNextResponse(
      { 
        error: "Failed to create Stripe session",
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    );
  }
}