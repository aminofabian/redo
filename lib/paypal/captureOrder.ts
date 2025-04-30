// lib/paypal/captureOrder.ts
import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { getPayPalClient } from './client';

export async function capturePayPalOrder(orderId: string) {
  try {
    const client = getPayPalClient();
    const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    
    // Prefer to receive the full order details in the response
    request.prefer('return=representation');
    
    // Execute the capture request
    const response = await client.execute(request);
    console.log(response, 'Capture response:::::::::::::::::::::::::::::::::::::::', response);
    
    // Extract the relevant information from the capture
    const captureId = response.result.purchase_units[0].payments.captures[0].id;
    const captureStatus = response.result.purchase_units[0].payments.captures[0].status;
    
    return {
      id: orderId,
      captureId,
      status: response.result.status,
      captureStatus,
      orderDetails: response.result
    };
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    throw error;
  }
}