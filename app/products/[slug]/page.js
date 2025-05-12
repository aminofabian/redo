import { useState, useEffect } from 'react';

const ye = () => {
  // Check if the code is running in a browser environment
  const isClient = typeof window !== 'undefined'
  
  // Only access localStorage when in a client environment
  if (isClient) {
    // Your original localStorage code here
    return localStorage.getItem('whatever'); // or whatever operation you were doing
  }
  
  // Return a default value when running on the server
  return null; // or other appropriate default
} 

function YourComponent() {
  // Initialize state with a default value
  const [localStorageValue, setLocalStorageValue] = useState(null);
  
  // Only run localStorage code after component mounts (client-side only)
  useEffect(() => {
    // Safe to access localStorage here
    const storedValue = localStorage.getItem('your-key');
    setLocalStorageValue(storedValue);
  }, []);
  
  // Use localStorageValue in your component
  
  // ... rest of component
} 