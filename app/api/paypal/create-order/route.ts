// app/api/paypal/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal/createOrder';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cartItems } = body;
    console.log(cartItems, 'itemssss:.......:...................');

    if (!cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json({ message: 'Invalid cart items' }, { status: 400 });
    }

    const order = await createPayPalOrder(cartItems);
    console.log(order, 'order createddddddddddddddddddddddddddd');
    return NextResponse.json(order, { status: 200 });

  } catch (error) {
    console.error('Create Order Error:', error);
    return NextResponse.json(
      { message: 'Error creating PayPal order' },
      { status: 500 }
    );
  }
}
