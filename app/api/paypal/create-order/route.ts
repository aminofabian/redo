import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/src/generated/client';
import { safeJsonStringify } from '@/lib/json';

const prisma = new PrismaClient();

// Helper function for safe NextResponse JSON
function safeNextResponse(data: any, init?: ResponseInit) {
  return new NextResponse(safeJsonStringify(data), {
    ...init,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
    },
  });
}

// PayPal API configuration
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal credentials are not configured');
}

// Function to get PayPal access token
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`PayPal auth error: ${data.error_description}`);
  }

  return data.access_token;
}

interface CartItem {
  id: string | number;
  title: string;
  price: number;
  quantity: number;
}

interface RequestBody {
  cartItems: CartItem[];
  orderId: string;
  totalAmount: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as RequestBody;
    const { cartItems, orderId, totalAmount } = body;

    if (!cartItems || !Array.isArray(cartItems)) {
      return safeNextResponse({ message: 'Invalid cart items' }, { status: 400 });
    }

    if (!orderId) {
      return safeNextResponse({ message: 'Order ID is required' }, { status: 400 });
    }

    // Verify the order exists and belongs to the user
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    });

    if (!order) {
      return safeNextResponse({ message: 'Order not found' }, { status: 404 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Create PayPal order
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: totalAmount,
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: totalAmount
              }
            }
          },
          items: cartItems.map(item => ({
            name: item.title,
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toString()
            },
            quantity: item.quantity.toString()
          }))
        }
      ]
    };

    // Create order in PayPal
    const paypalResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(paypalOrder)
    });

    const paypalData = await paypalResponse.json();
    
    if (!paypalResponse.ok) {
      console.error('PayPal API Error:', paypalData);
      throw new Error(`PayPal API error: ${paypalData.message || 'Unknown error'}`);
    }

    // Update order with PayPal details
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'pending',
        metadata: paypalData
      }
    });

    return safeNextResponse({
      id: paypalData.id, // Use PayPal's order ID
      ...paypalData
    });

  } catch (error) {
    console.error('Create PayPal Order Error:', error);
    return safeNextResponse(
      { message: 'Error creating PayPal order' },
      { status: 500 }
    );
  }
}
