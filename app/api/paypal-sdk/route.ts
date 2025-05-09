import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  // Make sure PAYPAL_CLIENT_ID is set in your .env file
  const clientId = process.env.PAYPAL_CLIENT_ID;
  
  if (!clientId) {
    console.error('PAYPAL_CLIENT_ID environment variable is not set');
    return new Response(
      JSON.stringify({ error: 'PayPal configuration is not available' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  try {
    return new Response(
      JSON.stringify({
        clientId: clientId,
        currency: 'USD',
        intent: 'capture',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in PayPal SDK endpoint:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get PayPal configuration' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 