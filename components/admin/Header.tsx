"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onAddProduct: () => void;
}

export function Header({ onAddProduct }: HeaderProps) {
  return (
    <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500">Welcome back, Admin</p>
      </div>
      <Button 
        onClick={onAddProduct}
        className="gap-2 bg-[#1e2c51] hover:bg-[#1e2c51]/90 text-white"
      >
        <Plus className="w-4 h-4" />
        Add New Product
      </Button>
    </div>
  );
} 