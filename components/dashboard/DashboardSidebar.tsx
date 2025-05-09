"use client";

import { 
  Home,
  BookOpen,
  Download,
  ShoppingCart,
  FileText,
  History,
  Settings,
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Overview",
    icon: Home,
    href: "/dashboard",
    color: "from-blue-600 to-indigo-600"
  },
  {
    title: "My Materials",
    icon: BookOpen,
    href: "/dashboard/materials",
    color: "from-purple-600 to-pink-600"
  },
  {
    title: "Downloads",
    icon: Download,
    href: "/dashboard/downloads",
    color: "from-green-600 to-teal-600"
  },
  {
    title: "Purchase History",
    icon: ShoppingCart,
    href: "/dashboard/purchases",
    color: "from-orange-600 to-yellow-600"
  },
  {
    title: "My Orders",
    icon: Package,
    href: "/dashboard/orders",
    color: "from-amber-600 to-orange-600"
  },
  {
    title: "Practice Tests",
    icon: FileText,
    href: "/dashboard/tests",
    color: "from-red-600 to-pink-600"
  },
  {
    title: "Study History",
    icon: History,
    href: "/dashboard/history",
    color: "from-cyan-600 to-blue-600"
  }
];

const bottomMenuItems = [
  {
    title: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    color: "from-gray-600 to-gray-500"
  },
  {
    title: "Help & Support",
    icon: HelpCircle,
    href: "/dashboard/support",
    color: "from-violet-600 to-purple-600"
  }
];

interface DashboardSidebarProps {
  onClose?: () => void;
  isCollapsed?: boolean;
  onCollapse?: (collapsed: boolean) => void;
}

export default function DashboardSidebar({ 
  onClose, 
  isCollapsed = false,
  onCollapse
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "fixed left-0 top-[57px] h-[calc(100vh-57px)] bg-gradient-to-b from-[#1e2c51] to-[#151e36] py-4",
      "transition-all duration-300 ease-in-out",
      isCollapsed ? "w-[72px]" : "w-64",
      "lg:ml-4 lg:rounded-xl lg:my-4"
    )}>
      <div className="flex flex-col h-full relative">
        {/* Collapse Toggle Button */}
        <button
          onClick={() => onCollapse?.(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-5 w-6 h-6 rounded-full bg-white shadow-md",
            "flex items-center justify-center text-[#1e2c51]",
            "hover:bg-gray-100 transition-colors",
            "hidden lg:flex"
          )}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Premium Status */}
        <div className={cn(
          "px-4 py-3 mx-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-amber-500/10 mb-6",
          "transition-all duration-300",
          isCollapsed ? "opacity-0" : "opacity-100"
        )}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-amber-500">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className={cn(
              "transition-all duration-300",
              isCollapsed ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
            )}>
              <div className="text-sm font-medium text-white">Premium</div>
              <div className="text-xs text-yellow-500/80 mt-1">
                Valid until Mar 2025
              </div>
            </div>
          </div>
        </div>

        {/* Main Menu */}
        <div className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.href}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                    "transition-all duration-200 group relative",
                    isActive 
                      ? 'text-white bg-white/10' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <div className={cn(
                    "relative p-2 rounded-lg bg-gradient-to-br shadow-lg",
                    item.color
                  )}>
                    <item.icon className="w-4 h-4 text-white" />
                    {isActive && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-white"
                      />
                    )}
                  </div>
                  <span className={cn(
                    "transition-all duration-300",
                    isCollapsed ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                  )}>
                    {item.title}
                  </span>
                  {isActive && (
                    <div className="absolute inset-y-0 left-0 w-1 bg-white rounded-r-full" />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Menu */}
        <div className="mt-auto pt-6 border-t border-white/10 px-3">
          <div className="space-y-1">
            {bottomMenuItems.map((item) => (
              <motion.div
                key={item.href}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium",
                    "transition-all duration-200 group",
                    pathname === item.href 
                      ? 'text-white bg-white/10' 
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br shadow-lg",
                    item.color
                  )}>
                    <item.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={cn(
                    "transition-all duration-300",
                    isCollapsed ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                  )}>
                    {item.title}
                  </span>
                </Link>
              </motion.div>
            ))}

            {/* Logout Button */}
            <motion.div
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/logout"
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium 
                  text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg 
                  transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-red-600 to-red-700 shadow-lg">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
                <span className={cn(
                  "transition-all duration-300",
                  isCollapsed ? "opacity-0 translate-x-4" : "opacity-100 translate-x-0"
                )}>
                  Sign Out
                </span>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </aside>
  );
} 