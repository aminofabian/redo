// pages/api/paypal/webhook.ts
import { processPayPalWebhook, verifyPayPalWebhook } from '@/lib/paypal/webhook';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get the raw request body as a string
    const rawBody = JSON.stringify(req.body);
    
    // Verify the webhook signature
    const headers = Object.fromEntries(
      Object.entries(req.headers).filter(([_, value]) => value !== undefined)
    ) as { [key: string]: string | string[] };
    const isVerified = await verifyPayPalWebhook(rawBody, headers);
    
    if (!isVerified) {
      console.error('PayPal webhook signature validation failed');
      return res.status(401).json({ message: 'Webhook signature validation failed' });
    }
    
    // Process the webhook event
    const event = req.body;
    const result = await processPayPalWebhook(event);
    
    // Return processing result
    return res.status(200).json({ message: 'Webhook processed successfully', result });
  } catch (error) {
    console.error('API error processing PayPal webhook:', error);
    return res.status(500).json({ 
      message: 'Error processing PayPal webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Set up NextJS API config to read raw body for signature verification
export const config = {
  api: {
    bodyParser: {
      // Parse the raw body string for the webhook signature verification
      raw: {
        type: 'application/json'
      }
    }
  }
};