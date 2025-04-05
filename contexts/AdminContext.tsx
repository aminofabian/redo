"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Product {
  id: string;
  title: string;
  status: string;
  lastUpdated: string;
  price: string;
  sales: number;
  description?: string;
  images?: { id: string; url: string; isPrimary: boolean; }[];
  categories?: string[];
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

interface AdminContextType {
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  selectedItem: AdminItem;
  setSelectedItem: (item: AdminItem) => void;
  sidebarFilter: string;
  setSidebarFilter: (filter: string) => void;
}

export const AdminContext = createContext<AdminContextType>({
  activeMenu: "Overview",
  setActiveMenu: () => {},
  selectedItem: null,
  setSelectedItem: () => {},
  sidebarFilter: "",
  setSidebarFilter: () => {},
});

export function AdminProvider({ children }: { children: ReactNode }) {
  const [activeMenu, setActiveMenu] = useState("Overview");
  const [selectedItem, setSelectedItem] = useState<AdminItem>(null);
  const [sidebarFilter, setSidebarFilter] = useState("");

  return (
    <AdminContext.Provider
      value={{
        activeMenu,
        setActiveMenu,
        selectedItem,
        setSelectedItem,
        sidebarFilter,
        setSidebarFilter,
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