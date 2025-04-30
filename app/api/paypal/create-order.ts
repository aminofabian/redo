// pages/api/paypal/create-order.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPayPalOrder } from '@/lib/paypal/createOrder';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get cart items from request body
    const { cartItems } = req.body;
    console.log('Cart items received:::::::::::::::::::::::::::::::::::::::', cartItems);
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: 'Invalid cart items' });
    }

    // Create PayPal order
    const order = await createPayPalOrder(cartItems);
    
    // Return the order ID and links
    return res.status(200).json({
      id: order.id,
      status: order.status,
      links: order.links
    });
  } catch (error) {
    console.error('API error creating PayPal order:', error);
    return res.status(500).json({ 
      message: 'Error creating PayPal order',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}