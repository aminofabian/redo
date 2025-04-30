// lib/paypal/webhook.ts
import crypto from 'crypto';

// Function to verify webhooks sent by PayPal
export async function verifyPayPalWebhook(
  body: string,
  headers: { [key: string]: string | string[] }
) {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    
    if (!webhookId) {
      throw new Error('PayPal webhook ID not configured');
    }

    // Get the PayPal-Transmission-Id from the header
    const transmissionId = headers['paypal-transmission-id'] as string;
    const timeStamp = headers['paypal-transmission-time'] as string;
    const webhookSignature = headers['paypal-transmission-sig'] as string;
    const webhookEvent = body;
    
    // Validate required fields
    if (!transmissionId || !timeStamp || !webhookSignature || !webhookEvent) {
      return false;
    }

    // Get PayPal certificate
    const certUrl = headers['paypal-cert-url'] as string;
    const certResponse = await fetch(certUrl);
    const cert = await certResponse.text();

    // Format the expected signature message
    const signatureMessage = transmissionId + '|' + timeStamp + '|' + webhookId + '|' + crypto.createHash('sha256').update(webhookEvent).digest('hex');

    // Verify the signature
    const verify = crypto.createVerify('sha256');
    verify.update(signatureMessage);
    return verify.verify(cert, webhookSignature, 'base64');
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error);
    return false;
  }
}

// Process different webhook event types
export async function processPayPalWebhook(event: any) {
  const eventType = event.event_type;
  const resource = event.resource;

  switch (eventType) {
    case 'PAYMENT.CAPTURE.COMPLETED':
      // Payment was captured successfully
      // Update order status in the database
      return await handlePaymentCaptured(resource);

    case 'PAYMENT.CAPTURE.DENIED':
      // Payment was denied
      return await handlePaymentDenied(resource);

    case 'PAYMENT.CAPTURE.REFUNDED':
      // Payment was refunded
      return await handlePaymentRefunded(resource);

    default:
      // Handle other events or ignore
      console.log(`Unhandled PayPal webhook event type: ${eventType}`);
      return { status: 'ignored', eventType };
  }
}

async function handlePaymentCaptured(resource: any) {
  // Implement your business logic here
  // For example, update order status to 'paid' in your database
  // Trigger order fulfillment, send confirmation email, etc.
  
  // Example: Update order status in database
  const orderId = resource.supplementary_data?.related_ids?.order_id;
  
  console.log(`Payment captured for order: ${orderId}`);
  
  // TODO: Add your database update code here
  
  return { 
    status: 'processed', 
    action: 'payment_captured',
    orderId 
  };
}

async function handlePaymentDenied(resource: any) {
  // Handle denied payment
  const orderId = resource.supplementary_data?.related_ids?.order_id;
  
  console.log(`Payment denied for order: ${orderId}`);
  
  // TODO: Update order status to 'payment_failed' in your database
  
  return { 
    status: 'processed', 
    action: 'payment_denied',
    orderId 
  };
}

async function handlePaymentRefunded(resource: any) {
  // Handle refunded payment
  const orderId = resource.supplementary_data?.related_ids?.order_id;
  
  console.log(`Payment refunded for order: ${orderId}`);
  
  // TODO: Update order status to 'refunded' in your database
  
  return { 
    status: 'processed', 
    action: 'payment_refunded',
    orderId 
  };
}