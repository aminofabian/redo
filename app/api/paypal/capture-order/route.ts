// pages/api/paypal/capture-order.ts

import { PrismaClient } from '@/src/generated/client';

const prisma = new PrismaClient();


export async function POST(req: Request) {
  try {
    const body = await req.json(); 
    const { paypalOrderDetails, orderId } = body;

    if (!paypalOrderDetails || !orderId) {
      return new Response(JSON.stringify({ message: "Missing required data" }), { status: 400 });
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, orderItems: true },  // Include orderItems to create purchases
    });

    if (!order) {
      return new Response(JSON.stringify({ message: "Order not found" }), { status: 404 });
    }

    const capture = paypalOrderDetails.purchase_units[0].payments.captures[0];

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: {
        amount: capture.amount.value,
        currency: capture.amount.currency_code,
        status: capture.status === "COMPLETED" ? "completed" : "failed",
        paymentMethod: "paypal",
        paymentType: "one-time",
        gatewayId: "paypal",
        gatewayTransactionId: capture.id,
        gatewayCustomerId: order.userId,
        receiptEmail: order.user?.email || null,
        orders: { connect: { id: order.id } },
        metadata: paypalOrderDetails,
      },
    });

    // Update the order with transaction details
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: capture.status === "COMPLETED" ? "paid" : "failed",
        paymentStatus: capture.status === "COMPLETED" ? "paid" : "failed",
        transactionId: transaction.id,
      },
    });

    // If the payment was successful, create entries in the purchase table
    if (capture.status === "COMPLETED") {
      for (const item of order.orderItems) {
        await prisma.purchase.create({
          data: {
            product: { connect: { id: item.productId } },
            user: { connect: { id: order.userId } },
            amount: item.price,
            status: 'completed',
            transactions: { connect: { id: transaction.id } },
          },
        });
      }
    }

    // Return the updated order and transaction details
    return new Response(JSON.stringify({
      orderId: updatedOrder.id,
      status: updatedOrder.status,
      transactionId: transaction.id,
    }), { status: 200 });

  } catch (error) {
    console.error("Server error saving PayPal transaction:", error);
    return new Response(JSON.stringify({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    }), { status: 500 });
  }
}


// import { capturePayPalOrder } from '@/lib/paypal/captureOrder';
// import { PrismaClient } from '@/src/generated/client';

// const prisma = new PrismaClient();

// export async function POST(req: Request) {
//   try {
    

//     const body = await req.json(); 
//     const { paypalOrderId,orderId } = body;

//     if (!paypalOrderId) {
//       return new Response(
//         JSON.stringify({ message: 'Order ID is required' }),
//         { status: 400 }
//       );
//     }

//     const captureData = await capturePayPalOrder(paypalOrderId);

//     if (!captureData || !captureData.id || !captureData.status) {
//       return new Response(
//         JSON.stringify({ message: 'Failed to capture PayPal order data' }),
//         { status: 500 }
//       );
//     }

//     const order = await prisma.order.findUnique({
//       where: {
//         id: orderId,
//       },
//       include: {
//         user: true,
//       },
//     });

//     if (!order) {
//       return new Response(
//         JSON.stringify({ message: 'Order not found' }),
//         { status: 404 }
//       );
//     }

//     const transaction = await prisma.transaction.create({
//       data: {
//         amount: order.totalAmount,
//         currency: order.currency,
//         status: captureData.status === 'COMPLETED' ? 'completed' : 'failed',
//         paymentMethod: 'paypal',
//         paymentType: 'one-time',
//         gatewayId: 'paypal', 
//         gatewayTransactionId: captureData.id,
//         gatewayCustomerId: order.userId,
//         receiptEmail: order.user ? order.user.email : null,
//         orders: {
//           connect: {
//             id: order.id,
//           },
//         },
//         metadata: captureData,
//       },
//     });


//     const updatedOrder = await prisma.order.update({
//       where: {
//         id: order.id,
//       },
//       data: {
//         status: captureData.status === 'COMPLETED' ? 'paid' : 'failed',
//         paymentStatus: captureData.status === 'COMPLETED' ? 'paid' : 'failed',
//         transactionId: transaction.id,
//       },
//     });

//     return new Response(
//       JSON.stringify({
//         orderId: updatedOrder.id,
//         status: updatedOrder.status,
//         transactionId: transaction.id,
//         captureId: captureData.id,
//         captureStatus: captureData.status,
//       }),
//       { status: 200 }
//     );
//   } catch (error) {

//     return new Response(
//       JSON.stringify({
//         message: 'Error capturing PayPal order',
//         error: error instanceof Error ? error.message : 'Unknown error',
//         stack: error instanceof Error ? error.stack : undefined,
//       }),
//       { status: 500 }
//     );
//   }
// }
