'use client';


import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Types for API response
interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: number;
    // Add other product fields as needed
    // title: string;
    // imageUrl: string;
  };
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  orderItems: OrderItem[];
  transaction: {
    status: string;
    completedAt: string;
    amount: number;
    currency: string;
  };
}

interface OrdersResponse {
  orders: Order[];
}

const UserOrdersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // Call your API endpoint to get completed orders
        const response = await axios.get<OrdersResponse>('/api/completed');
        setOrders(response.data.orders);
        setError(null);
      } catch (err) {
        setError('Failed to fetch your orders');
        console.error('Error fetching orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return <div className="loading">Loading your orders...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="no-orders">
        <h2>You haven't placed any orders yet</h2>
        <p>Browse our products and make your first purchase!</p>
        <button onClick={() => window.location.href = '/products'}>
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <h1>My Orders</h1>
      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>Order #{order.id.substring(0, 8)}</h3>
              <span className="order-date">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="order-items">
              {order.orderItems.map(item => (
                <div key={item.id} className="order-item">
                  <div className="product-info">
                    {/* You can add product image here */}
                    <p>Product #{item.product.id}</p>
                    <p>Quantity: {item.quantity}</p>
                  </div>
                  <div className="item-price">
                    {order.transaction.currency} {item.price}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="order-footer">
              <div className="order-total">
                <strong>Total:</strong> {order.transaction.currency} {order.totalAmount}
              </div>
              <div className="order-actions">
                <button 
                  onClick={() => window.location.href = `/orders/${order.id}`}
                  className="view-details-btn">
                  View Details
                </button>
                <button 
                  onClick={() => window.location.href = `/orders/${order.id}/download`}
                  className="download-btn">
                  Access Products
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserOrdersPage;