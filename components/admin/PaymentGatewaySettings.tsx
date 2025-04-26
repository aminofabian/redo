'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type PaymentGateway = {
  id: string;
  name: string;
  isActive: boolean;
  config: any;
  description?: string;
  notes?: string;
};

export default function PaymentGatewaySettings({
  initialGateways,
  onSave
}: {
  initialGateways?: PaymentGateway[];
  onSave?: (gateways: PaymentGateway[]) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gateways, setGateways] = useState<PaymentGateway[]>(initialGateways || []);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/payment-gateways');
      const data = await response.json();
      
      if (data.gateways) {
        setGateways(data.gateways);
      } else {
        // If no gateways exist yet, create default structure
        setGateways([
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
        ]);
      }
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      toast.error('Failed to load payment gateways');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = (index: number) => {
    const updatedGateways = [...gateways];
    updatedGateways[index].isActive = !updatedGateways[index].isActive;
    setGateways(updatedGateways);
  };

  const handleConfigChange = (index: number, field: string, value: any) => {
    const updatedGateways = [...gateways];
    updatedGateways[index].config = {
      ...updatedGateways[index].config,
      [field]: value
    };
    setGateways(updatedGateways);
  };

  const handleTestModeChange = (index: number, value: boolean) => {
    const updatedGateways = [...gateways];
    if (updatedGateways[index].name === 'STRIPE') {
      updatedGateways[index].config.testMode = value;
    } else if (updatedGateways[index].name === 'PAYPAL') {
      updatedGateways[index].config.sandbox = value;
    }
    setGateways(updatedGateways);
  };

  const handleNotesChange = (index: number, value: string) => {
    const updatedGateways = [...gateways];
    updatedGateways[index].notes = value;
    setGateways(updatedGateways);
  };

  const saveGateways = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/payment-gateways', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gateways }),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Payment gateways updated successfully');
        if (data.gateways) {
          setGateways(data.gateways);
          if (onSave) onSave(data.gateways);
        }
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving payment gateways:', error);
      toast.error('Failed to update payment gateways');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading payment gateway settings...</span>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Payment Gateway Settings</CardTitle>
        <CardDescription>
          Configure and activate payment gateways for your store. You can enable one or both gateways.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stripe">
          <TabsList className="mb-4">
            <TabsTrigger value="stripe">Stripe</TabsTrigger>
            <TabsTrigger value="paypal">PayPal</TabsTrigger>
          </TabsList>
          
          {/* Stripe Configuration */}
          <TabsContent value="stripe">
            {gateways.map((gateway, index) => {
              if (gateway.name !== 'STRIPE') return null;
              
              return (
                <div key={gateway.id || index} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Stripe Gateway</h3>
                      <p className="text-sm text-muted-foreground">Enable or disable Stripe payments</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="stripe-active"
                        checked={gateway.isActive}
                        onCheckedChange={() => handleToggleActive(index)}
                      />
                      <Label htmlFor="stripe-active">
                        {gateway.isActive ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="stripe-api-key">API Key</Label>
                      <Input
                        id="stripe-api-key"
                        type="password"
                        value={gateway.config.apiKey || ''}
                        onChange={(e) => handleConfigChange(index, 'apiKey', e.target.value)}
                        placeholder="sk_test_..."
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stripe-webhook-secret">Webhook Secret</Label>
                      <Input
                        id="stripe-webhook-secret"
                        type="password"
                        value={gateway.config.webhookSecret || ''}
                        onChange={(e) => handleConfigChange(index, 'webhookSecret', e.target.value)}
                        placeholder="whsec_..."
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="stripe-test-mode"
                        checked={gateway.config.testMode}
                        onCheckedChange={(checked) => handleTestModeChange(index, checked)}
                      />
                      <Label htmlFor="stripe-test-mode">
                        Test Mode {gateway.config.testMode ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="stripe-notes">Notes</Label>
                      <Textarea
                        id="stripe-notes"
                        value={gateway.notes || ''}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                        placeholder="Add any notes about your Stripe configuration"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
          
          {/* PayPal Configuration */}
          <TabsContent value="paypal">
            {gateways.map((gateway, index) => {
              if (gateway.name !== 'PAYPAL') return null;
              
              return (
                <div key={gateway.id || index} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">PayPal Gateway</h3>
                      <p className="text-sm text-muted-foreground">Enable or disable PayPal payments</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="paypal-active"
                        checked={gateway.isActive}
                        onCheckedChange={() => handleToggleActive(index)}
                      />
                      <Label htmlFor="paypal-active">
                        {gateway.isActive ? 'Active' : 'Inactive'}
                      </Label>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="paypal-client-id">Client ID</Label>
                      <Input
                        id="paypal-client-id"
                        value={gateway.config.clientId || ''}
                        onChange={(e) => handleConfigChange(index, 'clientId', e.target.value)}
                        placeholder="Your PayPal client ID"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="paypal-client-secret">Client Secret</Label>
                      <Input
                        id="paypal-client-secret"
                        type="password"
                        value={gateway.config.clientSecret || ''}
                        onChange={(e) => handleConfigChange(index, 'clientSecret', e.target.value)}
                        placeholder="Your PayPal client secret"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="paypal-sandbox"
                        checked={gateway.config.sandbox}
                        onCheckedChange={(checked) => handleTestModeChange(index, checked)}
                      />
                      <Label htmlFor="paypal-sandbox">
                        Sandbox Mode {gateway.config.sandbox ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="paypal-notes">Notes</Label>
                      <Textarea
                        id="paypal-notes"
                        value={gateway.notes || ''}
                        onChange={(e) => handleNotesChange(index, e.target.value)}
                        placeholder="Add any notes about your PayPal configuration"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={saveGateways} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 