import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import { getPayPalClient } from './client';

interface CartItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  finalPrice?: number;
  isPackage?: boolean;
  packageSize?: number;
  packageItems?: CartItem[];
}

export async function createPayPalOrder(cartItems: CartItem[]) {
  try {
    const client = getPayPalClient();
    const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    
    // Calculate the total
    const totalPrice = cartItems.reduce(
      (sum, item) => sum + (item.price * item.quantity), 
      0
    ).toFixed(2);
    
    // Build the order request
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: 'Your purchase',
          amount: {
            currency_code: 'USD',
            value: totalPrice,
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: totalPrice
              },
              shipping: {
                currency_code: 'USD',
                value: '0.00'
              },
              handling: {
                currency_code: 'USD',
                value: '0.00'
              },
              insurance: {
                currency_code: 'USD',
                value: '0.00'
              },
              shipping_discount: {
                currency_code: 'USD',
                value: '0.00'
              },
              discount: {
                currency_code: 'USD',
                value: '0.00'
              },
              tax_total: {
                currency_code: 'USD',
                value: '0.00'
              }
            }
          },
          items: cartItems.map(item => ({
            name: item.title,
            unit_amount: {
              currency_code: 'USD',
              value: item.price.toFixed(2)
            },
            quantity: item.quantity.toString(),
            category: 'PHYSICAL_GOODS' // Or 'DIGITAL_GOODS' depending on the item
          }))
        }
      ],
      application_context: {
        shipping_preference: 'NO_SHIPPING'
      }
    });

    // Execute the request
    const response = await client.execute(request);
    console.log(response, 'responseeeee.....................................:wenaaaaaaaaaaaaaaaa')
    
    return {
      id: response.result.id,
      status: response.result.status,
      links: response.result.links
    };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
}
