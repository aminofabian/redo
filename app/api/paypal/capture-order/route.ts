import { capturePayPalOrder } from '@/lib/paypal/captureOrder';
import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    

    const body = await req.json(); // Ensure body is parsed
    const { paypalOrderId,orderId } = body;
    console.log('Request body::::::::::::::', body); // Debugging log to check request body

    console.log('Received orderID:', paypalOrderId); // Debugging log to check orderID

    if (!paypalOrderId) {
      return new Response(
        JSON.stringify({ message: 'Order ID is required' }),
        { status: 400 }
      );
    }

    // Capture PayPal order
    const captureData = await capturePayPalOrder(paypalOrderId);
    console.log('Capture data received:', captureData); // Debugging log to check capture data

    if (!captureData || !captureData.id || !captureData.status) {
      return new Response(
        JSON.stringify({ message: 'Failed to capture PayPal order data' }),
        { status: 500 }
      );
    }

    // Retrieve the order by orderID to update it
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
      },
      include: {
        user: true, // Include the related user data
      },
    });

    if (!order) {
      return new Response(
        JSON.stringify({ message: 'Order not found' }),
        { status: 404 }
      );
    }

    // Update the Transaction table with the capture details
    const transaction = await prisma.transaction.create({
      data: {
        amount: order.totalAmount,
        currency: order.currency,
        status: captureData.status === 'COMPLETED' ? 'completed' : 'failed',
        paymentMethod: 'paypal',
        paymentType: 'one-time',
        gatewayId: 'paypal', // Assuming you have a PayPal gateway configured
        gatewayTransactionId: captureData.id,
        gatewayCustomerId: order.userId,
        receiptEmail: order.user ? order.user.email : null,
        orders: {
          connect: {
            id: order.id,
          },
        },
        metadata: captureData, // Store the capture data for reference
      },
    });

    console.log(transaction, 'transactionsssssssssssssss...............:')

    // Update the Order table with the transaction reference and payment status
    const updatedOrder = await prisma.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: captureData.status === 'COMPLETED' ? 'paid' : 'failed',
        paymentStatus: captureData.status === 'COMPLETED' ? 'paid' : 'failed',
        transactionId: transaction.id,
      },
    });

    // Return the successful response with capture details
    return new Response(
      JSON.stringify({
        orderId: updatedOrder.id,
        status: updatedOrder.status,
        transactionId: transaction.id,
        captureId: captureData.id,
        captureStatus: captureData.status,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error capturing PayPal order:', error);

    // Return error response with message and stack trace (if available)
    return new Response(
      JSON.stringify({
        message: 'Error capturing PayPal order',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      }),
      { status: 500 }
    );
  }
}
