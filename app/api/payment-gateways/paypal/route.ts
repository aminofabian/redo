// api/payment-gateways/paypal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    // 🔒 Check if user is logged in
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const paypalClientId = process.env.PAYPAL_CLIENT_ID;

    if (!paypalClientId) {
      console.error('PAYPAL_CLIENT_ID is missing in environment variables');
      return NextResponse.json({ error: 'PayPal Client ID not configured' }, { status: 500 });
    }

    return NextResponse.json({ clientId: paypalClientId });
  } catch (error) {
    console.error('Error fetching PayPal client ID:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
