// app/api/stripe/webhook/route.ts
import Stripe from "stripe";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

// Your webhook secret from the Stripe dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret!);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // Handle specific events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Retrieve the session with line items
        const expandedSession = await stripe.checkout.sessions.retrieve(
          session.id,
          { expand: ['line_items', 'customer_details'] }
        );
        
        // Get customer and order details
        const customerDetails = expandedSession.customer_details;
        const lineItems = expandedSession.line_items;
        
        // Save order to database
        await saveOrderToDatabase({
          sessionId: session.id,
          customerId: session.customer,
          customerEmail: customerDetails?.email,
          customerName: customerDetails?.name,
          amount: session.amount_total,
          currency: session.currency,
          paymentStatus: session.payment_status,
          items: lineItems?.data || [],
          metadata: session.metadata,
          // Add any other fields you need
        });
        
        // Send confirmation email
        if (customerDetails?.email) {
          await sendOrderConfirmationEmail({
            email: customerDetails.email,
            name: customerDetails.name || '',
            orderId: session.id,
            amount: (session.amount_total || 0) / 100, // Convert from cents
            currency: session.currency || 'usd',
          });
        }
        
        break;
      }
      
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`❌ Payment failed: ${paymentIntent.id}`);
        
        // Handle failed payment (e.g., notify customer, update order status)
        await handleFailedPayment(paymentIntent);
        
        break;
      }
      
      // Add more event handlers as needed
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error processing webhook: ${err}`);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

// --- Example implementation functions (replace with your actual implementations) ---

async function saveOrderToDatabase(orderData: any) {
  // Example implementation - replace with your database code
  // e.g., using Prisma, MongoDB, etc.
  console.log("💾 Saving order to database:", orderData);
  
  // Example with Prisma:
  // const order = await prisma.order.create({
  //   data: {
  //     stripeSessionId: orderData.sessionId,
  //     customerId: orderData.customerId,
  //     customerEmail: orderData.customerEmail,
  //     amount: orderData.amount / 100, // Convert from cents
  //     currency: orderData.currency,
  //     status: orderData.paymentStatus,
  //     items: { create: orderData.items.map(item => ({
  //       name: item.description,
  //       quantity: item.quantity,
  //       price: item.amount_total / 100 / item.quantity,
  //     }))},
  //   },
  // });
  
  return true;
}

async function sendOrderConfirmationEmail(data: any) {
  // Example implementation - replace with your email service
  console.log("📧 Sending confirmation email to:", data.email);
  
  // Example with a service like Resend, SendGrid, etc.
  // await resend.emails.send({
  //   from: 'orders@yourdomain.com',
  //   to: data.email,
  //   subject: `Order Confirmation #${data.orderId.slice(-8)}`,
  //   react: EmailTemplate({ 
  //     name: data.name,
  //     orderId: data.orderId,
  //     amount: data.amount,
  //     currency: data.currency
  //   }),
  // });
  
  return true;
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  // Example implementation - handle failed payments
  console.log("❌ Handling failed payment:", paymentIntent.id);
  
  // Update order status in your database
  // Notify customer about failed payment
  
  return true;
}