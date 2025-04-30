// components/OrderSummary.js
import { useState } from 'react';
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  amount_total: number;
}

import type { Address } from '@stripe/stripe-js';


interface CheckoutSession {
  id: string;
  amount_total: number;
  shipping: {
    address: Address;
  };
  line_items: {
    data: LineItem[];
  };
}

interface Props {
  session: CheckoutSession;
}
const OrderSummary: React.FC<Props> = ({ session }) => {
  const formatAddress = (address: Address) => {
    const { line1, line2, city, state, postal_code, country } = address;
    const formattedAddress = [line1, line2, city, state, postal_code, country]
      .filter(Boolean)
      .join(', ');
    return formattedAddress || 'N/A';
  };
  return (
    <div>
      <h2>Order Summary</h2>
      <p>Order ID: {session.id}</p>
      <p>Total Amount: ${session.amount_total / 100}</p>
      <p>Shipping Address: {formatAddress(session.shipping.address)}</p>
      <div>
        <h3>Line Items</h3>
        {session.line_items.data.map((item: LineItem) => (
          <div key={item.id}>
            <p>{item.description}</p>
            <p>Quantity: {item.quantity}</p>
            <p>Price: ${item.amount_total / 100}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default OrderSummary;