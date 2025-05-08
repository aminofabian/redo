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
    
    // If we didn't have userId from session, handle the case where user might be null
    // This prevents the "Field user is required to return data, got `null` instead" error
    userId = userId || (order.user?.id || 'guest-user');

    // Extract the payment intent ID properly from the Stripe session
    // First check what type of data we're getting
    console.log("Payment intent type:", typeof stripeSession.payment_intent);
    
    // The payment_intent could be an object (when expanded) or just an ID string
    let paymentIntentId: string;
    if (typeof stripeSession.payment_intent === 'string') {
      paymentIntentId = stripeSession.payment_intent;
    } else if (stripeSession.payment_intent && typeof stripeSession.payment_intent === 'object') {
      // It's the expanded object, so extract the id property
      paymentIntentId = (stripeSession.payment_intent as any).id || '';
    } else {
      // Fallback
      paymentIntentId = String(stripeSession.id); // Use session ID as fallback
    }
    
    console.log("Extracted Payment Intent ID:", paymentIntentId);
    
    // Prepare transaction data without trying to connect to a payment gateway
    // This will avoid the 500 error if the payment gateway doesn't exist
    const transactionData = {
      amount: order.totalAmount,
      currency: order.currency,
      status: 'completed',
      // Remove the payment gateway relation that's causing errors
      // We'll just store the gateway ID as a transaction ID instead
      gatewayTransactionId: paymentIntentId,
      completedAt: new Date(),
      metadata: {
        stripeSessionId: sessionId,
        paymentMethod: 'card', // Assuming card payment through Stripe
        gatewayName: 'stripe' // Store the gateway name in metadata instead
      }
    };
    
    // Log transaction data for debugging
    console.log("Transaction data prepared:", JSON.stringify(transactionData, null, 2));

    // Wrap the entire process in a try-catch block for better error reporting
    try {
      // Begin a transaction to ensure all updates happen together
      const result = await prisma.$transaction(async (tx) => {
        // 1. Create the transaction record
        let transaction;
        try {
          console.log("Creating transaction record...");
          transaction = await tx.transaction.create({
            data: transactionData
          });
          console.log("Transaction created with ID:", transaction.id);
        } catch (err) {
          console.error("Error creating transaction:", err);
          // Send detailed error info to console
          if (err instanceof Error) {
            console.error('Transaction create error details:', {
              message: err.message,
              name: err.name,
              stack: err.stack,
            });
          }
          throw err; // Re-throw to abort the transaction
        }

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

        // At this point, userId should be defined from order.user?.id or as 'guest-user' if the user is null
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
    } catch (txError) {
      console.error("Error during transaction processing:", txError);
      return NextResponse.json(
        { success: false, message: "Transaction processing failed", details: txError instanceof Error ? txError.message : "Unknown error" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    
    // We need to get the session ID from the URL again since searchParams isn't in this scope
    const { searchParams: errorParams } = new URL(request.url);
    const sessionIdForError = errorParams.get('session_id');
    
    // Send detailed error info to the frontend
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to verify payment", 
        details: error instanceof Error ? error.message : "Unknown error",
        session_id: sessionIdForError
      },
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