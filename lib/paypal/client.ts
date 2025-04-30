import { core } from '@paypal/checkout-server-sdk';
const PayPalHttpClient = core.PayPalHttpClient;

// Create PayPal client based on environment
export const getPayPalClient = () => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not configured');
  }

  const environment = process.env.NODE_ENV === 'production'
    ? new core.LiveEnvironment(clientId, clientSecret)
    : new core.SandboxEnvironment(clientId, clientSecret);

  return new PayPalHttpClient(environment);
};