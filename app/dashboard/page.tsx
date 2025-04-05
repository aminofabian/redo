"use client";

import { motion } from "framer-motion";
import { 
  Download, 
  BookOpen, 
  Star, 
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  BookMarked,
  Bell,
  Plus,
  ShoppingCart,
  X,
  Sparkles,
  Zap,
  Rocket,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const stats = [
  {
    label: "Available Downloads",
    value: "15",
    unit: "files",
    change: "+3 new",
    icon: Download,
    trend: "up"
  },
  {
    label: "Practice Tests",
    value: "24",
    unit: "tests",
    change: "+2 new",
    icon: FileText,
    trend: "up"
  },
  {
    label: "Study Materials",
    value: "8",
    unit: "courses",
    change: "+1 new",
    icon: BookMarked,
    trend: "up"
  },
  {
    label: "Valid Until",
    value: "127",
    unit: "days",
    change: "Active",
    icon: Clock,
    trend: "up"
  }
];

const purchasedMaterials = [
  {
    id: 1,
    title: "NCLEX-RN Comprehensive Package",
    downloadCount: 2,
    maxDownloads: 5,
    validUntil: "2024-06-15",
    size: "245 MB",
    status: "Active",
    progress: 40
  },
  {
    id: 2,
    title: "Med-Surg Practice Tests Bundle",
    downloadCount: 1,
    maxDownloads: 3,
    validUntil: "2024-05-20",
    size: "180 MB",
    status: "Active",
    progress: 25
  },
  {
    id: 3,
    title: "Pediatric Nursing Study Guide",
    downloadCount: 0,
    maxDownloads: 3,
    validUntil: "2024-06-01",
    size: "156 MB",
    status: "Not Started",
    progress: 0
  }
];

const recommendedResources = [
  {
    title: "Critical Care Nursing Package",
    price: "$99.99",
    rating: 4.8,
    reviews: 245,
    image: "/nursingresources/ai-generated-8451341_1280.png"
  },
  {
    title: "OB/GYN Practice Tests",
    price: "$79.99",
    rating: 4.9,
    reviews: 189,
    image: "/nursingresources/julia-taubitz-4o3FFu9jenw-unsplash.jpg"
  }
];

export default function Dashboard() {
  const [isQuickMenuOpen, setIsQuickMenuOpen] = useState(false);
  const { data: session } = useSession();
  
  const firstName = session?.user?.firstName || session?.user?.name?.split(' ')[0] || 'Student';

  const quickActions = [
    {
      icon: ShoppingCart,
      label: "Buy Materials",
      href: "/store"
    },
    {
      icon: Download,
      label: "Quick Download",
      href: "/dashboard/downloads"
    },
    {
      icon: FileText,
      label: "Start Test",
      href: "/dashboard/tests"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mobile Header */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#1e2c51]">
            Welcome Back, {firstName} 👋
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-500"
            >
              <Bell className="w-6 h-6" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-[#1e2c51] text-white">
                    {firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600" 
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex lg:justify-between lg:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1e2c51]">
            Welcome Back, {firstName} 👋
          </h1>
          <p className="text-gray-600">
            Access your purchased materials and track your study progress
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500"
          >
            <Bell className="w-6 h-6" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session?.user?.image || ""} />
                  <AvatarFallback className="bg-[#1e2c51] text-white">
                    {firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{session?.user?.name || firstName}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600" 
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.button
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-4 lg:p-6 rounded-xl shadow-sm relative group 
              hover:shadow-md transition-all duration-200 text-left
              active:scale-95 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 lg:p-2 bg-[#1e2c51]/5 rounded-lg">
                <stat.icon className="w-4 h-4 lg:w-5 lg:h-5 text-[#1e2c51]" />
              </div>
              <span className="text-xs lg:text-sm font-medium text-[#1e2c51] bg-[#1e2c51]/5 
                px-2 py-0.5 rounded-full">
                {stat.change}
              </span>
            </div>
            <h3 className="text-gray-600 text-xs lg:text-sm mb-0.5">{stat.label}</h3>
            <div className="text-lg lg:text-2xl font-bold text-[#1e2c51] flex items-baseline gap-1">
              {stat.value}
              <span className="text-xs lg:text-sm font-normal text-gray-500">
                {stat.unit}
              </span>
            </div>
            
            {/* Hover/Active Indicator */}
            <div className="absolute inset-0 border-2 border-[#1e2c51] opacity-0 
              group-hover:opacity-100 rounded-xl transition-opacity duration-200" />
          </motion.button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-24 lg:mb-6">
        {/* Purchased Materials */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-[#1e2c51] mb-4">
            Purchased Materials
          </h2>
          <div className="space-y-4">
            {purchasedMaterials.map((material) => (
              <div 
                key={material.id}
                className="p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{material.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span>{material.size}</span>
                      <span>Valid until: {new Date(material.validUntil).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-[#1e2c51] border-[#1e2c51]"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Downloads:</span>
                    <span className="font-medium text-[#1e2c51]">
                      {material.downloadCount}/{material.maxDownloads}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium
                    ${material.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}
                  `}>
                    {material.status}
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#1e2c51] rounded-full transition-all duration-300"
                    style={{ width: `${material.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Resources */}
        <div className="bg-white rounded-xl shadow-sm p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-[#1e2c51] mb-4">
            Recommended For You
          </h2>
          <div className="space-y-4">
            {recommendedResources.map((resource, index) => (
              <div 
                key={index}
                className="group cursor-pointer"
              >
                <div className="relative h-32 rounded-lg overflow-hidden mb-3">
                  <img
                    src={resource.image}
                    alt={resource.title}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                </div>
                <h3 className="font-medium text-gray-900 group-hover:text-[#1e2c51] transition-colors">
                  {resource.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm text-gray-600">
                      {resource.rating} ({resource.reviews})
                    </span>
                  </div>
                  <span className="font-semibold text-[#1e2c51]">
                    {resource.price}
                  </span>
                </div>
              </div>
            ))}
            <Button 
              className="w-full bg-[#1e2c51] hover:bg-[#1e2c51]/90 text-white mt-4"
            >
              View All Resources
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Quick Actions */}
      <div className="fixed right-4 bottom-[4.5rem] lg:hidden flex flex-col items-end gap-3 z-50">
        {/* Quick Action Menu */}
        {isQuickMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsQuickMenuOpen(false)}
            />
            {/* Menu Items */}
            <div className="relative flex flex-col-reverse gap-2 mb-3">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: index * 0.05,
                    type: "spring",
                    stiffness: 300,
                    damping: 20
                  }}
                >
                  <Link href={action.href}>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="h-11 pl-4 pr-5 rounded-full bg-white shadow-lg 
                        flex items-center gap-3 border border-gray-100
                        hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <span className="p-1.5 rounded-full bg-[#1e2c51]/5">
                        <action.icon className="w-4 h-4 text-[#1e2c51]" />
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {action.label}
                      </span>
                    </Button>
                  </Link>
                </motion.div>
              ))}
            </div>
          </>
        )}
        
        {/* Main Action Button */}
        <motion.div
          initial={false}
          animate={isQuickMenuOpen ? "open" : "closed"}
          className="relative z-50"
        >
          <Button
            size="lg"
            onClick={() => setIsQuickMenuOpen(!isQuickMenuOpen)}
            className={cn(
              "h-12 w-12 rounded-full transition-all duration-300",
              "shadow-lg hover:shadow-xl",
              "border-3 border-white",
              "transform hover:scale-105 active:scale-95",
              isQuickMenuOpen 
                ? "bg-gray-900 rotate-45" 
                : "bg-gradient-to-r from-[#1e2c51] to-[#2a3d6d]"
            )}
          >
            {isQuickMenuOpen ? (
              <Plus 
                className={cn(
                  "w-5 h-5 text-white transition-transform duration-200",
                  "rotate-90"
                )} 
              />
            ) : (
              <div className="relative">
                <Rocket 
                  className="w-5 h-5 text-white transition-all duration-200 
                    transform -rotate-45"
                />
                <motion.div
                  animate={{ 
                    opacity: [0.5, 1, 0.5],
                    scale: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-1 -right-1"
                >
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                </motion.div>
              </div>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
} 