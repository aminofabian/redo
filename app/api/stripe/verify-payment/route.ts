// app/api/stripe/verify-payment/route.ts
import Stripe from "stripe";
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/getAuthSession";

// Define types for order data structure
// Import Decimal type from Prisma to handle currency values
import { Decimal } from '@prisma/client/runtime/library';

interface Product {
  id: string | bigint | number;
  title: string;
  description?: string | null;
  downloadLimit?: number | null;
  downloadUrl?: string | null;
  accessDuration?: number | null;
  [key: string]: any; // Allow for additional properties from Prisma
}

interface OrderItem {
  id: string | bigint | number;
  price: number | bigint | Decimal;
  quantity: number;
  productId: string | bigint | number;
  product: Product;
  [key: string]: any; // Allow for additional properties from Prisma
}

interface Order {
  id: string | bigint | number;
  totalAmount: number | bigint | Decimal;
  currency: string;
  status: string;
  paymentStatus: string;
  orderItems: OrderItem[];
  userId?: string | null;
  transactionId?: string | null;
  paymentIntentId?: string | null;
  metadata?: any;
  [key: string]: any; // Allow for additional properties from Prisma
}

interface TransactionResult {
  updatedOrder: Order;
  purchases: any[];
}

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

// POST is more appropriate for actions that change state
export const POST = async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return safeNextResponse(
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
      return safeNextResponse(
        { success: false, message: "Payment not completed" },
        { status: 400 }
      );
    }

    // Get order ID from the Stripe session metadata
    // Stripe puts the metadata we set during checkout session creation here
    const orderId = stripeSession.metadata?.orderId;
    
    if (!orderId) {
      return safeNextResponse(
        { success: false, message: "No order ID found in session metadata" },
        { status: 400 }
      );
    }
    
    console.log("Looking for order with ID:", orderId);
    
    // Find the order in our database using the orderId from session metadata
    let order;
    try {
      // The orderId from Stripe metadata will be a string, but our database ID might be a BigInt
      // Let's try both ways to be safe
      order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: orderId }, // Try as a string first
            // Safely handle numeric IDs without risking BigInt conversion errors
            { id: { contains: orderId } } // This will match if orderId is contained within the ID string
          ]
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          // Don't require user to avoid the "Field user is required to return data" error
          user: false 
        }
      });
    } catch (findError) {
      console.error('Error finding order:', findError);
      return safeNextResponse(
        { success: false, message: "Error finding order", details: findError instanceof Error ? findError.message : "Unknown error" },
        { status: 500 }
      );
    }
    
    console.log("Order found:", order ? "Yes" : "No");

    if (!order) {
      return safeNextResponse(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }
    
    // Since we excluded the user relation in our query to avoid the error,
    // we'll just use the userId from session or a default guest user ID
    // This prevents accessing order.user which would cause a TypeScript error
    if (!userId) {
      // If no userId from session, look it up separately to avoid the original error
      try {
        const orderUser = await prisma.order.findFirst({
          where: {
            OR: [
              { id: orderId },
              // Safely handle numeric IDs without risking BigInt conversion errors
              { id: { contains: orderId } } // This will match if orderId is contained within the ID string
            ]
          },
          select: { userId: true }
        });
        userId = orderUser?.userId || 'guest-user';
      } catch (userLookupError) {
        console.warn('Could not retrieve user ID for order, using guest user:', userLookupError);
        userId = 'guest-user';
      }
    }

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
        // Explicitly declare the type for the transaction result
        let result: TransactionResult;
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
      // We need to include the orderItems with their products to satisfy our Order interface
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
      }) as unknown as Order; // Cast to our Order interface type

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

      // Return an object that matches our TransactionResult interface
      return { 
        updatedOrder: {
          ...updatedOrder,
          // Ensure the order matches our interface by explicitly including orderItems
          orderItems: updatedOrder.orderItems || []
        } as Order, 
        purchases 
      };
    });

      // Format the response for the success page
      // Use the defined Order interface to properly type the result
      const updatedOrder = result.updatedOrder as Order;
      const orderDetails = {
        id: typeof updatedOrder.id === 'bigint' ? updatedOrder.id.toString() : updatedOrder.id,
        totalAmount: Number(updatedOrder.totalAmount),
        items: updatedOrder.orderItems.map((item: OrderItem) => ({
          id: item.id,
          title: item.product.title,
          price: Number(item.price),
          quantity: item.quantity,
          downloadAvailable: Boolean(item.product.downloadUrl)
        }))
      };

      return safeNextResponse({
        success: true,
        message: "Payment verified and order processed successfully",
        orderId: result.updatedOrder.id,
        orderDetails
      });
    } catch (txError) {
      console.error("Error during transaction processing:", txError);
      return safeNextResponse(
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
    return safeNextResponse(
      { 
        success: false, 
        message: "Failed to verify payment", 
        details: error instanceof Error ? error.message : "Unknown error",
        session_id: sessionIdForError
      },
      { status: 500 }
    );
  }
};

// Keep GET endpoint for backward compatibility
export const GET = async (request: Request) => {
  return safeNextResponse(
    { success: false, message: "Please use POST method for payment verification" },
    { status: 405 }
  );
}