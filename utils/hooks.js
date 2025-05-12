'use client';

import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Initialize with initialValue
  const [storedValue, setStoredValue] = useState(initialValue);
  
  useEffect(() => {
    try {
      const item = localStorage.getItem(key);
      setStoredValue(item ? JSON.parse(item) : initialValue);
    } catch (error) {
      console.error(error);
      setStoredValue(initialValue);
    }
  }, [key, initialValue]);
  
  const setValue = (value) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
} 