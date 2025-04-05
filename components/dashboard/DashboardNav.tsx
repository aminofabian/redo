"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";

export default function DashboardNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-[57px] bg-white border-b z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-xl text-[#1e2c51]">
            RN Resources
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <div className="h-8 w-8 rounded-full bg-[#1e2c51] flex items-center justify-center text-white">
            A
          </div>
        </div>
      </div>
    </nav>
  );
} 