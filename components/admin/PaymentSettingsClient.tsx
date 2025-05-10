"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Save } from "lucide-react";

export default function PaymentSettingsClient() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeGateway, setActiveGateway] = useState("stripe");

  // Simple state to store form data
  const [formData, setFormData] = useState({
    stripe: {
      enabled: true,
      apiKey: "",
      webhookSecret: "",
      testMode: true
    },
    paypal: {
      enabled: false,
      clientId: "",
      clientSecret: "",
      testMode: true
    }
  });

  const handleInputChange = (gateway: string, field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [gateway]: {
        ...prev[gateway as keyof typeof prev],
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log("Payment settings updated:", formData);
      // Here you would save to your backend
    } catch (error) {
      console.error("Failed to update payment settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Payment Gateway Settings</h1>
      
      <Tabs defaultValue="stripe" onValueChange={setActiveGateway}>
        <TabsList className="mb-4">
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleSubmit}>
          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Stripe Configuration</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="stripe-enabled">Enabled</Label>
                    <Switch 
                      id="stripe-enabled" 
                      checked={formData.stripe.enabled}
                      onCheckedChange={(checked) => handleInputChange("stripe", "enabled", checked)}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="stripe-api-key">API Key</Label>
                    <Input 
                      id="stripe-api-key"
                      type="text"
                      value={formData.stripe.apiKey}
                      onChange={(e) => handleInputChange("stripe", "apiKey", e.target.value)}
                      placeholder="sk_test_..."
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="stripe-webhook-secret">Webhook Secret</Label>
                    <Input 
                      id="stripe-webhook-secret"
                      type="text"
                      value={formData.stripe.webhookSecret}
                      onChange={(e) => handleInputChange("stripe", "webhookSecret", e.target.value)}
                      placeholder="whsec_..."
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="stripe-test-mode" 
                      checked={formData.stripe.testMode}
                      onCheckedChange={(checked) => handleInputChange("stripe", "testMode", checked)}
                    />
                    <Label htmlFor="stripe-test-mode">Test Mode</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="paypal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>PayPal Configuration</span>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="paypal-enabled">Enabled</Label>
                    <Switch 
                      id="paypal-enabled" 
                      checked={formData.paypal.enabled}
                      onCheckedChange={(checked) => handleInputChange("paypal", "enabled", checked)}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="paypal-client-id">Client ID</Label>
                    <Input 
                      id="paypal-client-id"
                      type="text"
                      value={formData.paypal.clientId}
                      onChange={(e) => handleInputChange("paypal", "clientId", e.target.value)}
                      placeholder="Client ID from PayPal Developer Dashboard"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="paypal-client-secret">Client Secret</Label>
                    <Input 
                      id="paypal-client-secret"
                      type="text"
                      value={formData.paypal.clientSecret}
                      onChange={(e) => handleInputChange("paypal", "clientSecret", e.target.value)}
                      placeholder="Client Secret from PayPal Developer Dashboard"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch 
                      id="paypal-test-mode" 
                      checked={formData.paypal.testMode}
                      onCheckedChange={(checked) => handleInputChange("paypal", "testMode", checked)}
                    />
                    <Label htmlFor="paypal-test-mode">Test Mode (Sandbox)</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
  );
}
