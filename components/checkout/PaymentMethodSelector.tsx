'use client';

import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";
import { Loader2 } from "lucide-react";

type PaymentGateway = {
  id: string;
  name: string;
  isActive: boolean;
};

export default function PaymentMethodSelector({ 
  onSelectMethod 
}: { 
  onSelectMethod: (gatewayId: string) => void 
}) {
  const [loading, setLoading] = useState(true);
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);

  useEffect(() => {
    const fetchActiveGateways = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/payment-gateways/active');
        const data = await response.json();
        
        if (data.gateways && data.gateways.length > 0) {
          setGateways(data.gateways);
          setSelectedGateway(data.gateways[0].id);
          onSelectMethod(data.gateways[0].id);
        }
      } catch (error) {
        console.error('Error fetching active payment gateways:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveGateways();
  }, [onSelectMethod]);

  const handleSelectGateway = (gatewayId: string) => {
    setSelectedGateway(gatewayId);
    onSelectMethod(gatewayId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-20">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2">Loading payment methods...</span>
      </div>
    );
  }

  if (gateways.length === 0) {
    return (
      <div className="p-4 border rounded-md bg-amber-50 text-amber-700">
        No payment methods available. Please contact the store admin.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Select Payment Method</h3>
      
      <RadioGroup 
        value={selectedGateway || undefined}
        onValueChange={handleSelectGateway}
      >
        {gateways.map(gateway => (
          <div key={gateway.id} className="flex items-center space-x-2 border p-3 rounded-md">
            <RadioGroupItem value={gateway.id} id={gateway.id} />
            <Label htmlFor={gateway.id} className="flex items-center cursor-pointer">
              {gateway.name === 'STRIPE' ? (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Credit Card (Stripe)</span>
                </>
              ) : gateway.name === 'PAYPAL' ? (
                <>
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.5 8.5h-2a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z" fill="#00457C" stroke="#00457C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M17.5 16.5h-5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v.5" stroke="#00457C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2.5 11.5v7a2 2 0 0 0 2 2h10.5" stroke="#00457C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>PayPal</span>
                </>
              ) : (
                <span>{gateway.name}</span>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
} 