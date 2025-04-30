const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

export const paypal = {
    createOrder: async function createOrder(price: number) {
        const accessToken = await generateAccessToken();
        const response = await fetch(`${base}/v2/checkout/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                intent: 'CAPTURE',
                purchase_units: [
                    {
                        amount: {
                            currency_code: 'USD',
                            value: price.toString(),
                            breakdown: {
                                item_total: {
                                    currency_code: 'USD',
                                    value: price.toString()
                                }
                            }
                        }
                    }
                ]
            })
        })
       return handleResponse(response)
    },
    
    createPayment: async function createPayment(orderId: string) {
        const accessToken = await generateAccessToken();
        const response = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return handleResponse(response);
    }
}

async function generateAccessToken() {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const secret = process.env.PAYPAL_SECRET;

    if (!clientId || !secret) {
        throw new Error('PayPal credentials are not set');
    }

    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

    const response = await fetch(`${base}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch access token');
    }

    const data = await handleResponse(response);
    return data.access_token;
    
};

async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PayPal API error: ${errorText}`);
    }
    return response.json();
}