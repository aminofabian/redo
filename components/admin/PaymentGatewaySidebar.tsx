'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function PaymentGatewaySidebar() {
  const { setSelectedItem } = useAdmin();
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<any[]>([]);

  useEffect(() => {
    const fetchGateways = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/payment-gateways');
        const data = await response.json();
        
        if (data.gateways && data.gateways.length > 0) {
          setGateways(data.gateways);
          // Select the first gateway by default
          setSelectedItem({
            type: 'payment-gateway',
            id: 'settings',
            gateways: data.gateways
          });
        } else {
          // If no gateways, create default ones
          const defaultGateways = [
            {
              id: 'new-stripe',
              name: 'STRIPE',
              isActive: false,
              config: { apiKey: '', webhookSecret: '', testMode: true },
              description: 'Stripe payment gateway',
              notes: ''
            },
            {
              id: 'new-paypal',
              name: 'PAYPAL',
              isActive: false,
              config: { clientId: '', clientSecret: '', sandbox: true },
              description: 'PayPal payment gateway',
              notes: ''
            }
          ];
          setGateways(defaultGateways);
          setSelectedItem({
            type: 'payment-gateway',
            id: 'settings',
            gateways: defaultGateways
          });
        }
      } catch (error) {
        console.error('Error fetching payment gateways:', error);
        toast.error('Failed to load payment gateways');
      } finally {
        setLoading(false);
      }
    };

    fetchGateways();
  }, [setSelectedItem]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading payment gateways...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-medium mb-4">Payment Methods</h3>
      
      <div className="space-y-2">
        <button 
          className="w-full p-3 flex items-center gap-3 rounded-md bg-white shadow-sm hover:bg-gray-50"
          onClick={() => setSelectedItem({
            type: 'payment-gateway',
            id: 'settings',
            gateways
          })}
        >
          <CreditCard className="h-5 w-5 text-gray-500" />
          <div>
            <p className="font-medium text-left">Gateway Settings</p>
            <p className="text-sm text-gray-500 text-left">
              {gateways.filter(g => g.isActive).length} active gateways
            </p>
          </div>
        </button>
      </div>
    </div>
  );
} 