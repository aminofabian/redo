// pages/api/paypal/capture-order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { capturePayPalOrder } from '@/lib/paypal/captureOrder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get order ID from request body
    const { orderID } = req.body;
    console.log(orderID, 'hii no order ganiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii')

    if (!orderID) {
      return res.status(400).json({ message: 'Order ID is required' });
    }

    // Capture PayPal order
    const captureData = await capturePayPalOrder(orderID);

    // After successful capture, you would typically:
    // 1. Update your database with payment status
    // 2. Create receipt/invoice
    // 3. Process the order (send to fulfillment, etc.)

    // Example: Update order in database (implement this according to your DB)
    // await updateOrderPaymentStatus(orderID, 'paid');

    // Return capture details
    return res.status(200).json({
      id: captureData.id,
      status: captureData.status,
      captureId: captureData.captureId,
      captureStatus: captureData.captureStatus
    });
  } catch (error) {
    console.error('API error capturing PayPal order:', error);
    return res.status(500).json({ 
      message: 'Error capturing PayPal order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}