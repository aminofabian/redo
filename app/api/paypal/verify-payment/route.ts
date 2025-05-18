import { NextRequest } from 'next/server';
import { PrismaClient } from '@/src/generated/client';
import { safeJsonStringify } from '@/lib/json';

const prisma = new PrismaClient();

// PayPal API configuration
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
  throw new Error('PayPal credentials are not configured');
}

// Helper function for safe NextResponse JSON
function safeNextResponse(data: any, init?: ResponseInit) {
  return new Response(safeJsonStringify(data), {
    ...init,
    headers: {
      ...init?.headers,
      'Content-Type': 'application/json',
    },
  });
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

export async function POST(req: NextRequest) {
  try {
    const paymentId = req.nextUrl.searchParams.get('paymentId');
    
    if (!paymentId) {
      return safeNextResponse(
        { success: false, message: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Get order details from PayPal
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const orderDetails = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error('PayPal API Error:', orderDetails);
      throw new Error(`PayPal API error: ${orderDetails.message || 'Unknown error'}`);
    }

    // Find the order in our database
    const order = await prisma.order.findFirst({
      where: {
        metadata: {
          path: ['id'],
          equals: paymentId
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return safeNextResponse(
        { success: false, message: 'Order not found' },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'completed',
        paymentStatus: 'paid',
        metadata: {
          ...(order.metadata as Record<string, unknown> || {}),
          paypalDetails: orderDetails
        }
      },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    // Format the response
    const formattedItems = updatedOrder.orderItems.map(item => ({
      id: item.id,
      title: item.product.title,
      price: Number(item.price),
      quantity: item.quantity,
      downloadUrl: item.product.downloadUrl,
      fileType: item.product.fileType
    }));

    return safeNextResponse({
      success: true,
      message: 'Payment verified successfully',
      orderId: updatedOrder.id,
      orderDetails: {
        id: updatedOrder.id,
        totalAmount: Number(updatedOrder.totalAmount),
        items: formattedItems
      }
    });

  } catch (error) {
    console.error('PayPal Payment Verification Error:', error);
    return safeNextResponse(
      { success: false, message: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
