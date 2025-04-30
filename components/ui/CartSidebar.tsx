
'use client';

import { ShoppingBag, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useCart } from "@/lib/CartContext";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import axios from "axios";
import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { loadStripe } from '@stripe/stripe-js';
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY as string);


import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const LoadPayPal = () => {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();
  if(isPending) {
    return (<>
    <div className="flex justify-center py-8">

<Loader2 className="h-5 w-5 animate-spin" />
      </div>

    </>)
  } else if(isRejected) {
    return (<>
    <div className="flex justify-center py-8">
      <p className="text-red-500">Failed to load PayPal script</p>
      </div>
    </>)
  }
}
type PaymentGateway = {
  id: string;
  name: string;
  isActive: boolean;
  environment: string;
  businessName: string | null;
  supportsCreditCards: boolean;
  supportsDirectDebit: boolean;
};





type props = {
  priceId: string;
  price: string;
  description:string;
};



export function CartSidebar({ priceId, price, description }: props) {
  // const { items, removeItem, totalItems, totalPrice } = useCart();
  const { items, removeItem, totalItems, totalPrice, clearCart } = useCart();
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
  const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [totalPayout, setTotalPayout] = useState<string>('0.00');



  // Fetch PayPal client ID
  const fetchPaypalClientId = async () => {
    try {
      const response = await fetch('/api/payment-gateways/paypal');
      if (!response.ok) throw new Error('Failed to fetch PayPal Client ID');
      const data = await response.json();
      console.log(data, 'Fetched PayPal client ID');
      setPaypalClientId(data.clientId);
    } catch (error) {
      console.error('Error fetching PayPal client ID:', error);
    }
  };




  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      // Create checkout session
      const response = await fetch('/api/stripe/checkout-sessions/create', {
        
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: items,
          orderId
          // returnUrl: window.location.href,
        }),
      });

      const { sessionId, error } = await response.json();
      console.log(sessionId, 'sessionId,..................................................');

      if (error) {
        console.error('Error creating checkout session:', error);
        setIsLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise;
      const { error: stripeError } = await stripe!.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        console.error('Stripe checkout error:', stripeError);
      }
    } catch (err) {
      console.error('Checkout error:', err);
    }

    setIsLoading(false);
  };
  // const handleCheckout = async () => {
  //   const stripe = await stripePromise;
  //   // const response = await fetch('/api/stripe/checkout-sessions/create', {
  //   //   method: 'POST',
  //   // });

  //   const res = await fetch('/api/stripe/checkout-sessions/create', {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ cartItems: items, returnUrl: window.location.origin, }),
  //   });
  //   const session = await res.json();
  //   if (stripe) {
  //     await stripe.redirectToCheckout({ sessionId: session.id });
  //   } else {
  //     console.error('Stripe initialization failed.');
  //   }
  // };





  // Fetch active payment gateways
  const fetchPaymentGateways = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/payment-gateways');
      if (!response.ok) throw new Error('Failed to fetch payment gateways');
      const data = await response.json();
      console.log(data.gateways, 'Fetched payment gateways..................................');
      setPaymentGateways(data.gateways);

      // If PayPal is in the list, fetch its clientId automatically
      const hasPaypal = data.gateways.find((gateway: PaymentGateway) => gateway.name === 'PAYPAL');
      if (hasPaypal) {
        await fetchPaypalClientId();
      }
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
    } finally {
      setIsLoading(false);
    }
  };




  const handleProceedToPayment = async () => {
    try {
      setIsLoading(true);
  
      // Read from localStorage
      const localCart: { id: string; quantity: number }[] = JSON.parse(localStorage.getItem('cart') || '[]');
  
      // Step 1: Create the order
      const createOrderRes = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: localCart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        }),
      });
  
      if (!createOrderRes.ok) {
        throw new Error('Failed to create order');
      }
  
      const { orderId } = await createOrderRes.json();
      setOrderId(orderId);
      console.log(orderId, 'orderId,;,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,'); 

  
      // Step 2: Fetch payment gateways (must happen early)
      await fetchPaymentGateways();
  
      // Step 3: Fetch final price and product IDs
     await fetchIdsAndFinalPrice(orderId);
  
  
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIdsAndFinalPrice = async (orderId: string): Promise<{ finalPrice: number; productIds: string[] }> => {
    try {
      // Simulate a dummy fetch
      const response = await fetch(`/api/order/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order summary');
      }
      const data = await response.json();
      console.log('Fetched IDs and final price:', data);
  
      setTotalPayout(data.finalPrice);
      return {
        finalPrice: data.finalPrice,
        productIds: data.productIds,
      };
    } catch (error) {
      console.error('Error fetching IDs and final price:', error);
      throw error;
    }
  };


    const handlePaymentSuccess = () => {
    toast.success('Payment completed successfully!');
    clearCart(); // Clear the cart after successful payment
  };




  const togglePackage = (id: number) => {
    setExpandedPackages(current => 
      current.includes(id) 
        ? current.filter(i => i !== id)
        : [...current, id]
    );
  };

  if (items.length === 0) return null;



  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          <h2 className="font-bold text-lg">Cart Summary</h2>
        </div>
        <span className="text-sm text-gray-500">({totalItems} items)</span>
      </div>
      
      <div className="space-y-3 mb-4 max-h-[300px] overflow-auto">
        {items.map((item) => (
          <div key={item.id} className="border-b pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  {item.isPackage && (
                    <button 
                      onClick={() => togglePackage(item.id)}
                      className="p-0.5 hover:bg-gray-100 rounded"
                    >
                      {expandedPackages.includes(item.id) 
                        ? <ChevronDown className="h-4 w-4" />
                        : <ChevronRight className="h-4 w-4" />
                      }
                    </button>
                  )}
                  <p className="text-sm font-medium">{item.title}</p>
                </div>
                <p className="text-sm text-gray-600">
                  ${item.price.toFixed(2)}
                </p>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Package Items */}
            {item.isPackage && item.packageItems && expandedPackages.includes(item.id) && (
              <div className="mt-2 ml-6 space-y-1 text-sm text-gray-600">
                <p className="font-medium text-xs text-gray-500 mb-1">Package Items:</p>
                {item.packageItems.map((packageItem, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{packageItem.title}</span>
                    <span>${packageItem.price.toFixed(2)}</span>
                  </div>
                ))}
                <div className="text-xs text-green-600 font-medium pt-1">
                  75% Package Savings Applied
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="border-t pt-3">
        <div className="flex justify-between font-medium text-lg mb-4">
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        
        <Sheet onOpenChange={(open) => open && handleProceedToPayment()}>
          <SheetTrigger asChild>
            <Button className="w-full">
              Proceed to Checkout ({totalItems} items)
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Select Payment Method</SheetTitle>
            </SheetHeader>
            
            <div className="mt-6">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
              ) : paymentGateways.length === 0 ? (
                <p className="text-center text-gray-500">No payment methods available</p>
              ) : (
                <div className="space-y-4">
                  {paymentGateways.map((gateway) => (
                    <div 
                      key={gateway.id}
                      className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"

                      onClick={() => {
                        // Handle gateway selection
                        console.log(`Selected payment gateway: ${gateway.name}`);
                        if(gateway.name === 'PAYPAL') {
                          console.log('yes welcome to paypal..:')
                        }
                        // Will implement actual payment flow here
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{gateway.name}</h3>

                          {gateway.isActive && gateway.name === 'PAYPAL' && paypalClientId && (
                          <div className="mt-4">
                          <PayPalScriptProvider options={{ 
                            clientId: paypalClientId,
                            components: "buttons",
                            currency: "USD"
                          }}>
                            <LoadPayPal />
                            <PayPalButtons
                              disabled={isProcessingPayment}
                              style={{ layout: "vertical" }}
                              createOrder={async () => {
                                setIsProcessingPayment(true);
                                try {
                                  const res = await fetch("/api/paypal/create-order", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ cartItems: items }),
                                  });
                                  
                                  if (!res.ok) {
                                    const errorData = await res.json();
                                    throw new Error(errorData.message || 'Failed to create order');
                                  }
                                  
                                  const data = await res.json();
                                  setPaypalOrderId(data.id);
                                  return data.id;
                                } catch (error) {
                                  console.error("Error creating order:", error);
                                  toast.error("Failed to create order");
                                  setIsProcessingPayment(false);
                                  throw error;
                                }
                              }}
                              onApprove={async (data) => {
                                try {
                                  const res = await fetch("/api/paypal/capture-order", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ paypalOrderId: data.orderID, orderId }),
                                  });
                                  
                                  if (!res.ok) {
                                    const errorData = await res.json();
                                    throw new Error(errorData.message || 'Failed to capture payment');
                                  }
                                  
                                  await res.json();
                                  handlePaymentSuccess();
                                } catch (error) {
                                  console.error("Error capturing payment:", error);
                                  toast.error("Failed to complete payment");
                                } finally {
                                  setIsProcessingPayment(false);
                                }
                              }}
                              onError={(err) => {
                                console.error("PayPal error:", err);
                                toast.error("Payment error occurred");
                                setIsProcessingPayment(false);
                              }}
                              onCancel={() => {
                                setIsProcessingPayment(false);
                              }}
                            />
                          </PayPalScriptProvider>
                        </div>
                        )}
                          
                          {gateway.isActive && gateway.name === 'STRIPE' && (
                           <div className="flex flex-col items-center gap-4">
                           <h1 className="text-xl font-semibold">Stripe Checkout Example</h1>
                           <button
                             onClick={handleCheckout}
                             className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-md shadow-lg transition duration-300 ease-in-out"
                           >
                             Pay with Stripe
                           </button>
                         </div>
                          )}
         


                          {gateway.businessName && (
                            <p className="text-sm text-gray-500">
                              Powered by {gateway.businessName}
                            </p>
                          )}

                        </div>
                        <div className="text-sm">
                          {gateway.environment === 'test' && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              Test Mode
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-500 flex gap-2">
                        {gateway.supportsCreditCards && (
                          <span className="bg-gray-100 px-2 py-1 rounded">Credit Card</span>
                        )}
                        {gateway.supportsDirectDebit && (
                          <span className="bg-gray-100 px-2 py-1 rounded">Direct Debit</span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4 mt-6">
                    <div className="font-medium flex justify-between mb-2">
                      <span>Order Total:</span>
                      <span>${totalPayout}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {totalItems} item{totalItems !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
} 

// 'use client';

// import { ShoppingBag, X, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
// import { useCart } from "@/lib/CartContext";
// import { Button } from "@/components/ui/button";
// import { useState, useEffect } from "react";
// import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import { toast } from "react-hot-toast";

// const LoadPayPal = () => {
//   const [{ isPending, isRejected }] = usePayPalScriptReducer();
//   if(isPending) {
//     return (
//       <div className="flex justify-center py-4">
//         <Loader2 className="h-5 w-5 animate-spin" />
//       </div>
//     );
//   } else if(isRejected) {
//     return (
//       <div className="flex justify-center py-4">
//         <p className="text-red-500">Failed to load PayPal script</p>
//       </div>
//     );
//   }
//   return null;
// };

// type PaymentGateway = {
//   id: string;
//   name: string;
//   isActive: boolean;
//   environment: string;
//   businessName: string | null;
//   supportsCreditCards: boolean;
//   supportsDirectDebit: boolean;
// };

// export function CartSidebar() {
//   const { items, removeItem, totalItems, totalPrice, clearCart } = useCart();
//   const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
//   const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
//   const [isProcessingPayment, setIsProcessingPayment] = useState(false);
//   const [orderId, setOrderId] = useState<string | null>(null);

//   // Fetch PayPal client ID
//   const fetchPaypalClientId = async () => {
//     try {
//       const response = await fetch('/api/payment-gateways/paypal');
//       if (!response.ok) throw new Error('Failed to fetch PayPal Client ID');
//       const data = await response.json();
//       console.log('Fetched PayPal client ID:', data);
//       setPaypalClientId(data.clientId);
//     } catch (error) {
//       console.error('Error fetching PayPal client ID:', error);
//     }
//   };

//   // Fetch active payment gateways
//   const fetchPaymentGateways = async () => {
//     setIsLoading(true);
//     try {
//       const response = await fetch('/api/payment-gateways');
//       if (!response.ok) throw new Error('Failed to fetch payment gateways');
//       const data = await response.json();
//       console.log('Fetched payment gateways:', data.gateways);
//       setPaymentGateways(data.gateways);

//       // If PayPal is in the list, fetch its clientId automatically
//       const hasPaypal = data.gateways.find((gateway: PaymentGateway) => gateway.name === 'PAYPAL');
//       if (hasPaypal) {
//         await fetchPaypalClientId();
//       }
//     } catch (error) {
//       console.error('Error fetching payment gateways:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleProceedToPayment = async () => {
//     try {
//       setIsLoading(true);
  
//       // Fetch payment gateways
//       await fetchPaymentGateways();
  
//     } catch (error) {
//       console.error('Checkout error:', error);
//       toast.error('Failed to proceed to checkout');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const togglePackage = (id: number) => {
//     setExpandedPackages(current => 
//       current.includes(id) 
//         ? current.filter(i => i !== id)
//         : [...current, id]
//     );
//   };

//   const handlePaymentSuccess = () => {
//     toast.success('Payment completed successfully!');
//     clearCart(); // Clear the cart after successful payment
//   };

//   if (items.length === 0) return null;

//   return (
//     <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
//       <div className="flex items-center justify-between mb-3">
//         <div className="flex items-center gap-2">
//           <ShoppingBag className="h-5 w-5" />
//           <h2 className="font-bold text-lg">Cart Summary</h2>
//         </div>
//         <span className="text-sm text-gray-500">({totalItems} items)</span>
//       </div>
      
//       <div className="space-y-3 mb-4 max-h-[300px] overflow-auto">
//         {items.map((item) => (
//           <div key={item.id} className="border-b pb-2">
//             <div className="flex items-start justify-between gap-2">
//               <div className="flex-1">
//                 <div className="flex items-center gap-1">
//                   {item.isPackage && (
//                     <button 
//                       onClick={() => togglePackage(item.id)}
//                       className="p-0.5 hover:bg-gray-100 rounded"
//                     >
//                       {expandedPackages.includes(item.id) 
//                         ? <ChevronDown className="h-4 w-4" />
//                         : <ChevronRight className="h-4 w-4" />
//                       }
//                     </button>
//                   )}
//                   <p className="text-sm font-medium">{item.title}</p>
//                 </div>
//                 <p className="text-sm text-gray-600">
//                   ${item.price.toFixed(2)}
//                 </p>
//               </div>
//               <button
//                 onClick={() => removeItem(item.id)}
//                 className="text-red-500 hover:text-red-700 p-1"
//               >
//                 <X size={16} />
//               </button>
//             </div>

//             {/* Package Items */}
//             {item.isPackage && item.packageItems && expandedPackages.includes(item.id) && (
//               <div className="mt-2 ml-6 space-y-1 text-sm text-gray-600">
//                 <p className="font-medium text-xs text-gray-500 mb-1">Package Items:</p>
//                 {item.packageItems.map((packageItem, index) => (
//                   <div key={index} className="flex justify-between">
//                     <span>{packageItem.title}</span>
//                     <span>${packageItem.price.toFixed(2)}</span>
//                   </div>
//                 ))}
//                 <div className="text-xs text-green-600 font-medium pt-1">
//                   75% Package Savings Applied
//                 </div>
//               </div>
//             )}
//           </div>
//         ))}
//       </div>

//       <div className="border-t pt-3">
//         <div className="flex justify-between font-medium text-lg mb-4">
//           <span>Total:</span>
//           <span>${totalPrice.toFixed(2)}</span>
//         </div>
        
//         <Sheet onOpenChange={(open) => open && handleProceedToPayment()}>
//           <SheetTrigger asChild>
//             <Button className="w-full">
//               Proceed to Checkout ({totalItems} items)
//             </Button>
//           </SheetTrigger>
//           <SheetContent side="right" className="w-full sm:max-w-md">
//             <SheetHeader>
//               <SheetTitle>Select Payment Method</SheetTitle>
//             </SheetHeader>
            
//             <div className="mt-6">
//               {isLoading ? (
//                 <div className="flex justify-center py-8">
//                   <Loader2 className="h-8 w-8 animate-spin" />
//                 </div>
//               ) : paymentGateways.length === 0 ? (
//                 <p className="text-center text-gray-500">No payment methods available</p>
//               ) : (
//                 <div className="space-y-4">
//                   {paymentGateways.map((gateway) => (
//                     <div 
//                       key={gateway.id}
//                       className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
//                       onClick={() => {
//                         console.log(`Selected payment gateway: ${gateway.name}`);
//                       }}
//                     >
//                       <div className="flex items-center justify-between">
//                         <div>
//                           <h3 className="font-medium">{gateway.name}</h3>

//                           {gateway.isActive && gateway.name === 'PAYPAL' && paypalClientId && (
                            
//                           )}

//                           {gateway.businessName && (
//                             <p className="text-sm text-gray-500">
//                               Powered by {gateway.businessName}
//                             </p>
//                           )}
//                         </div>
                        
//                         <div className="text-sm">
//                           {gateway.environment === 'test' && (
//                             <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
//                               Test Mode
//                             </span>
//                           )}
//                         </div>
//                       </div>
                      
//                       <div className="mt-2 text-sm text-gray-500 flex gap-2">
//                         {gateway.supportsCreditCards && (
//                           <span className="bg-gray-100 px-2 py-1 rounded">Credit Card</span>
//                         )}
//                         {gateway.supportsDirectDebit && (
//                           <span className="bg-gray-100 px-2 py-1 rounded">Direct Debit</span>
//                         )}
//                       </div>
//                     </div>
//                   ))}
                  
//                   <div className="border-t pt-4 mt-6">
//                     <div className="font-medium flex justify-between mb-2">
//                       <span>Order Total:</span>
//                       <span>${totalPrice.toFixed(2)}</span>
//                     </div>
//                     <div className="text-sm text-gray-500">
//                       {totalItems} item{totalItems !== 1 ? 's' : ''}
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </div>
//           </SheetContent>
//         </Sheet>
//       </div>
//     </div>
//   );
// }




















// // 'use client';

// // import { ShoppingBag, X, ChevronDown, ChevronRight } from "lucide-react";
// // import { useCart } from "@/lib/CartContext";
// // import { Button } from "@/components/ui/button";
// // import { useState, useEffect } from "react";
// // import {
// //   Sheet,
// //   SheetContent,
// //   SheetHeader,
// //   SheetTitle,
// //   SheetTrigger,
// // } from "@/components/ui/sheet";

// // type PaymentGateway = {
// //   id: string;
// //   name: string;
// //   isActive: boolean;
// //   environment: string;
// //   businessName: string | null;
// //   supportsCreditCards: boolean;
// //   supportsDirectDebit: boolean;
// // };

// // export function CartSidebar() {
// //   const { items, removeItem, totalItems, totalPrice } = useCart();
// //   const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
// //   const [paymentGateways, setPaymentGateways] = useState<PaymentGateway[]>([]);
// //   const [isLoading, setIsLoading] = useState(false);

// //   // Fetch active payment gateways
// //   const fetchPaymentGateways = async () => {
// //     setIsLoading(true);
// //     try {
// //       const response = await fetch('/api/payment-gateways');
// //       if (!response.ok) throw new Error('Failed to fetch payment gateways');
// //       const data = await response.json();
// //       setPaymentGateways(data.gateways);
// //     } catch (error) {
// //       console.error('Error fetching payment gateways:', error);
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   const togglePackage = (id: number) => {
// //     setExpandedPackages(current => 
// //       current.includes(id) 
// //         ? current.filter(i => i !== id)
// //         : [...current, id]
// //     );
// //   };

// //   if (items.length === 0) return null;

// //   return (
// //     <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
// //       <div className="flex items-center justify-between mb-3">
// //         <div className="flex items-center gap-2">
// //           <ShoppingBag className="h-5 w-5" />
// //           <h2 className="font-bold text-lg">Cart Summary</h2>
// //         </div>
// //         <span className="text-sm text-gray-500">({totalItems} items)</span>
// //       </div>
      
// //       <div className="space-y-3 mb-4 max-h-[300px] overflow-auto">
// //         {items.map((item) => (
// //           <div key={item.id} className="border-b pb-2">
// //             <div className="flex items-start justify-between gap-2">
// //               <div className="flex-1">
// //                 <div className="flex items-center gap-1">
// //                   {item.isPackage && (
// //                     <button 
// //                       onClick={() => togglePackage(item.id)}
// //                       className="p-0.5 hover:bg-gray-100 rounded"
// //                     >
// //                       {expandedPackages.includes(item.id) 
// //                         ? <ChevronDown className="h-4 w-4" />
// //                         : <ChevronRight className="h-4 w-4" />
// //                       }
// //                     </button>
// //                   )}
// //                   <p className="text-sm font-medium">{item.title}</p>
// //                 </div>
// //                 <p className="text-sm text-gray-600">
// //                   ${item.price.toFixed(2)}
// //                 </p>
// //               </div>
// //               <button
// //                 onClick={() => removeItem(item.id)}
// //                 className="text-red-500 hover:text-red-700 p-1"
// //               >
// //                 <X size={16} />
// //               </button>
// //             </div>

// //             {/* Package Items */}
// //             {item.isPackage && item.packageItems && expandedPackages.includes(item.id) && (
// //               <div className="mt-2 ml-6 space-y-1 text-sm text-gray-600">
// //                 <p className="font-medium text-xs text-gray-500 mb-1">Package Items:</p>
// //                 {item.packageItems.map((packageItem, index) => (
// //                   <div key={index} className="flex justify-between">
// //                     <span>{packageItem.title}</span>
// //                     <span>${packageItem.price.toFixed(2)}</span>
// //                   </div>
// //                 ))}
// //                 <div className="text-xs text-green-600 font-medium pt-1">
// //                   75% Package Savings Applied
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         ))}
// //       </div>

// //       <div className="border-t pt-3">
// //         <div className="flex justify-between font-medium text-lg mb-4">
// //           <span>Total:</span>
// //           <span>${totalPrice.toFixed(2)}</span>
// //         </div>
        
// //         <Sheet onOpenChange={(open) => open && fetchPaymentGateways()}>
// //           <SheetTrigger asChild>
// //             <Button className="w-full">
// //               Proceed to Checkout ({totalItems} items)
// //             </Button>
// //           </SheetTrigger>
// //           <SheetContent side="right" className="w-full sm:max-w-md">
// //             <SheetHeader>
// //               <SheetTitle>Select Payment Method</SheetTitle>
// //             </SheetHeader>
            
// //             <div className="mt-6">
// //               {isLoading ? (
// //                 <div className="flex justify-center py-8">
// //                   <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
// //                 </div>
// //               ) : paymentGateways.length === 0 ? (
// //                 <p className="text-center text-gray-500">No payment methods available</p>
// //               ) : (
// //                 <div className="space-y-4">
// //                   {paymentGateways.map((gateway) => (
// //                     <div 
// //                       key={gateway.id}
// //                       className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
// //                       onClick={() => {
// //                         // Handle gateway selection
// //                         console.log(`Selected payment gateway: ${gateway.name}`);
// //                         // Will implement actual payment flow here
// //                       }}
// //                     >
// //                       <div className="flex items-center justify-between">
// //                         <div>
// //                           <h3 className="font-medium">{gateway.name}</h3>
// //                           {gateway.businessName && (
// //                             <p className="text-sm text-gray-500">
// //                               Powered by {gateway.businessName}
// //                             </p>
// //                           )}
// //                         </div>
// //                         <div className="text-sm">
// //                           {gateway.environment === 'test' && (
// //                             <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
// //                               Test Mode
// //                             </span>
// //                           )}
// //                         </div>
// //                       </div>
                      
// //                       <div className="mt-2 text-sm text-gray-500 flex gap-2">
// //                         {gateway.supportsCreditCards && (
// //                           <span className="bg-gray-100 px-2 py-1 rounded">Credit Card</span>
// //                         )}
// //                         {gateway.supportsDirectDebit && (
// //                           <span className="bg-gray-100 px-2 py-1 rounded">Direct Debit</span>
// //                         )}
// //                       </div>
// //                     </div>
// //                   ))}
                  
// //                   <div className="border-t pt-4 mt-6">
// //                     <div className="font-medium flex justify-between mb-2">
// //                       <span>Order Total:</span>
// //                       <span>${totalPrice.toFixed(2)}</span>
// //                     </div>
// //                     <div className="text-sm text-gray-500">
// //                       {totalItems} item{totalItems !== 1 ? 's' : ''}
// //                     </div>
// //                   </div>
// //                 </div>
// //               )}
// //             </div>
// //           </SheetContent>
// //         </Sheet>
// //       </div>
// //     </div>
// //   );
// // } 