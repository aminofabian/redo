"use client";

import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Home, BookOpen, Download, FileText, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

const mobileNavItems = [
  {
    icon: BookOpen,
    label: "Materials",
    href: "/dashboard/materials"
  },
  {
    icon: Download,
    label: "Files",
    href: "/dashboard/downloads"
  },
  {
    icon: Home,
    label: "Home",
    href: "/dashboard",
    primary: true
  },
  {
    icon: FileText,
    label: "Tests",
    href: "/dashboard/tests"
  },
  {
    icon: Menu,
    label: "Menu",
    action: "menu"
  }
];

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className={cn(inter.className, "min-h-screen bg-[#f8fafc]")}>
      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Background with blur effect */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-lg border-t border-gray-200" />
        
        {/* Content */}
        <div className="relative px-2 pb-2">
          <div className="flex items-center justify-between">
            {mobileNavItems.map((item) => {
              const isActive = item.href ? pathname === item.href : false;
              
              if (item.primary) {
                return (
                  <Link
                    key={item.href}
                    href={item.href!}
                    className="flex flex-col items-center -mt-5"
                  >
                    <div className={cn(
                      "p-4 rounded-full transition-all transform",
                      "bg-gradient-to-b from-[#1e2c51] to-[#2a3d6d]",
                      "shadow-lg shadow-[#1e2c51]/20",
                      "border-4 border-white",
                      isActive && "scale-110 rotate-12"
                    )}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium mt-1",
                      isActive ? "text-[#1e2c51]" : "text-gray-500"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                );
              }

              if (item.action === "menu") {
                return (
                  <button
                    key="menu"
                    onClick={() => setSidebarOpen(true)}
                    className="flex flex-col items-center py-2 w-16"
                  >
                    <div className={cn(
                      "p-2 rounded-full transition-all",
                      "hover:bg-gray-100",
                      isActive ? "text-[#1e2c51] bg-gray-100" : "text-gray-500"
                    )}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs mt-1 font-medium text-gray-500 truncate">
                      {item.label}
                    </span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href!}
                  className="flex flex-col items-center py-2 w-16"
                >
                  <div className={cn(
                    "p-2 rounded-full transition-all",
                    "hover:bg-gray-100",
                    isActive && "bg-gray-100"
                  )}>
                    <item.icon className={cn(
                      "w-6 h-6 transition-colors",
                      isActive ? "text-[#1e2c51]" : "text-gray-500"
                    )} />
                  </div>
                  <span className="text-xs mt-1 font-medium transition-colors truncate">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Desktop Nav */}
      <div className="hidden lg:block">
        <DashboardNav />
      </div>

      <div className="flex">
        {/* Sidebar with overlay for mobile */}
        <div className={cn(
          "fixed inset-0 z-50 lg:relative lg:z-0",
          !sidebarOpen && "hidden lg:block"
        )}>
          {/* Backdrop */}
          <div 
            className={cn(
              "fixed inset-0 bg-gray-900/80 lg:hidden",
              !sidebarOpen && "hidden"
            )}
            onClick={() => setSidebarOpen(false)}
          />
          <DashboardSidebar 
            onClose={() => setSidebarOpen(false)} 
            isCollapsed={isCollapsed}
            onCollapse={setIsCollapsed}
          />
        </div>

        {/* Main Content */}
        <main className={cn(
          "flex-1 pb-[80px] lg:pb-0 p-4 lg:p-8 pt-4 lg:pt-[calc(57px+2rem)]",
          "min-h-screen w-full transition-all duration-300",
          isCollapsed 
            ? "lg:ml-[88px]" // 72px sidebar + 16px margin
            : "lg:ml-[280px]" // 264px sidebar + 16px margin
        )}>
          <div className={cn(
            "max-w-full transition-all duration-300",
            isCollapsed 
              ? "lg:max-w-[calc(100vw-88px)]" 
              : "lg:max-w-[calc(100vw-280px)]"
          )}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 