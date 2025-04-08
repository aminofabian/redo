"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Bell, Menu, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarImage,
  AvatarFallback
} from "@/components/ui/avatar";

// User data interface
interface UserData {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  id?: string;
  image?: string;
  [key: string]: any;
}

export default function DashboardNav() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [session, setSession] = useState<any>(null);
  const [firstName, setFirstName] = useState<string>("");

  // Load user data on component mount
  useEffect(() => {
    // Get user data from localStorage or fetch from API
    const fetchUserData = async () => {
      try {
        // Try to get cached user data from localStorage first
        const cachedUser = localStorage.getItem('user-data');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUserData(parsedUser);
            
            // Extract first name if available
            if (parsedUser.name && parsedUser.name.includes(' ')) {
              setFirstName(parsedUser.name.split(' ')[0]);
            } else if (parsedUser.firstName) {
              setFirstName(parsedUser.firstName);
            } else if (parsedUser.name) {
              setFirstName(parsedUser.name);
            }
            
          } catch (e) {
            console.error("Error parsing cached user data", e);
          }
        }
        
        // Fetch session data as well
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        
        if (sessionData.user) {
          setSession(sessionData);
        }
      } catch (error) {
        console.error("Failed to load user data:", error);
      }
    };
    
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      // Call the custom logout endpoint
      await fetch("/api/auth/signout", {
        method: "POST",
      });
      
      // Clear client-side session state
      window.localStorage.removeItem('next-auth.session-token');
      window.localStorage.removeItem('next-auth.csrf-token');
      window.localStorage.removeItem('user-data');
      
      // Force a hard redirect to clear all state
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-[57px] bg-white border-b z-50">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-xl text-[#1e2c51]">
            RN Resources
          </Link>
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
                    {firstName?.charAt(0) || userData?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium">{session?.user?.name || userData?.name || firstName}</p>
                  <p className="text-xs text-gray-500">{session?.user?.email || userData?.email}</p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {userData?.role && (
                  <div className="flex flex-col">
                    <div className="font-bold">{userData.name || session?.user?.name || firstName || 'User'}</div>
                    <div className="text-sm text-muted-foreground">{userData.email || session?.user?.email || 'No email'}</div>
                    <div className="text-xs mt-1 px-2 py-0.5 bg-slate-100 rounded-full self-start">{userData.role}</div>
                  </div>
                )}
                {!userData?.role && 'My Account'}
              </DropdownMenuLabel>
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
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
} 