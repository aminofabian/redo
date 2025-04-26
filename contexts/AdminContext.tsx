"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Product {
  id: string;
  title: string;
  description?: string;
  status?: string;
  price: string;
  lastUpdated?: string;
  sales?: number;
  slug?: string;
  images?: Array<{id: string; url: string; isPrimary: boolean}>;
  categories?: string[];
  viewCount?: number;
  conversionRate?: string;
  lastPurchase?: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
    image?: string;
  };
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  verified?: boolean;
  twoFactorEnabled?: boolean;
  purchaseCount?: number;
  reviewCount?: number;
}

type AdminItem = Product | User | null;

type AdminContextType = {
  activeMenu: string;
  setActiveMenu: React.Dispatch<React.SetStateAction<string>>;
  selectedItem: any;
  setSelectedItem: React.Dispatch<React.SetStateAction<any>>;
  sidebarFilter: string;
  setSidebarFilter: React.Dispatch<React.SetStateAction<string>>;
  paymentGateways: any[];
  setPaymentGateways: React.Dispatch<React.SetStateAction<any[]>>;
};

export const AdminContext = createContext<AdminContextType>({
  activeMenu: "Overview",
  setActiveMenu: () => {},
  selectedItem: null,
  setSelectedItem: () => {},
  sidebarFilter: "",
  setSidebarFilter: () => {},
  paymentGateways: [],
  setPaymentGateways: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState("Overview");
  const [selectedItem, setSelectedItem] = useState<AdminItem>(null);
  const [sidebarFilter, setSidebarFilter] = useState("");
  const [paymentGateways, setPaymentGateways] = useState<any[]>([]);

  return (
    <AdminContext.Provider
      value={{
        activeMenu,
        setActiveMenu,
        selectedItem,
        setSelectedItem,
        sidebarFilter,
        setSidebarFilter,
        paymentGateways,
        setPaymentGateways,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
} 