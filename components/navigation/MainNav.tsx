"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogIn, LogOut, Book, Home, ShoppingCart, Search, Phone, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Update type for user object
interface UserData {
  name?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;  // Add role field
  id?: string;    // Add id field
  [key: string]: any; // For any other properties
}

export default function MainNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const pathname = usePathname();

  // Load auth state on initial render only
  useEffect(() => {
    const checkLocalAuth = () => {
      try {
        // First check for auth cookie
        const hasAuthCookie = document.cookie.includes('auth-status=authenticated');
        
        if (hasAuthCookie) {
          setIsLoggedIn(true);
          
          // Try to get cached user data from localStorage first
          const cachedUser = localStorage.getItem('user-data');
          if (cachedUser) {
            try {
              const parsedUser = JSON.parse(cachedUser);
              setUserData(parsedUser);
              return; // Use cached data, no need to fetch
            } catch (e) {
              console.error("Error parsing cached user data", e);
              // Continue to fetch if parse fails
            }
          }
          
          // Fetch fresh user data only if needed
          fetchUserData();
        } else {
          setIsLoggedIn(false);
          setUserData(null);
          localStorage.removeItem('user-data');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      }
    };
    
    // Separate function to fetch user data
    const fetchUserData = async () => {
      try {
        console.log("Fetching user data from session API...");
        const res = await fetch('/api/auth/session');
        const sessionData = await res.json();
        console.log("Session response raw:", sessionData);
        
        if (sessionData.user) {
          // Ensure user is an object, not a string
          const userFromSession = typeof sessionData.user === 'string' 
            ? JSON.parse(sessionData.user) 
            : sessionData.user;
            
          console.log("User from session (parsed if needed):", userFromSession);
          
          // Create proper user object
          const userObj = {
            ...(typeof userFromSession === 'object' ? userFromSession : {}),
            name: formatUserName(userFromSession)
          };
          
          console.log("Final user object to store:", userObj);
          
          // Save to state and localStorage 
          setUserData(userObj);
          localStorage.setItem('user-data', JSON.stringify(userObj));
        } else {
          console.log("No user in session, using fallback");
          const fallbackUser = { name: "User" };
          setUserData(fallbackUser);
          localStorage.setItem('user-data', JSON.stringify(fallbackUser));
        }
      } catch (e) {
        console.error("Error fetching session:", e);
        const fallbackUser = { name: "User" };
        setUserData(fallbackUser);
      }
    };
    
    // Initial check
    checkLocalAuth();
    
    // Only check on visibility change (tab focus), not continuous interval
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Only check auth cookie on visibility change, not full user data
        const hasAuthCookie = document.cookie.includes('auth-status=authenticated');
        if (hasAuthCookie !== isLoggedIn) {
          checkLocalAuth(); // Only refetch if auth state changed
        }
      }
    });
    
    return () => {
      document.removeEventListener('visibilitychange', checkLocalAuth);
    };
  }, []); // Empty dependency array - only run on mount

  // Then update the formatUserName function with proper typing
  const formatUserName = (user: UserData): string => {
    // If user has a name that's not "User", use it
    if (user.name && user.name !== "User") {
      return user.name;
    }
    
    // Handle firstName and lastName if available (direct properties)
    if (user.firstName || user.lastName) {
      return formatName(user.firstName, user.lastName);
    }
    
    // If we have an email, extract a name from it
    if (user.email) {
      // Get the part before the @ sign
      const parts = user.email.split('@')[0];
      
      // Check if it looks like "firstlast" or "first.last"
      const nameParts = parts.replace(/[._-]/g, ' ').trim().split(/\s+/);
      
      return nameParts
        .map(word => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
        .join(' ');
    }
    
    // Final fallback
    return "User";
  };

  // Helper function to format names consistently - update parameter types
  const formatName = (firstName?: string | null, lastName?: string | null): string => {
    // Ensure proper capitalization of first and last name
    const formatWord = (word?: string | null) => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
    };
    
    const formattedFirstName = formatWord(firstName);
    const formattedLastName = formatWord(lastName);
    
    if (formattedFirstName && formattedLastName) {
      return `${formattedFirstName} ${formattedLastName}`;
    }
    
    return formattedFirstName || formattedLastName || "User";
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      
      // Delete cookies directly in browser too
      document.cookie = "auth-status=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      document.cookie = "next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;";
      
      // Clear user data from localStorage
      localStorage.removeItem('user-data');
      
      // Reset state immediately
      setIsLoggedIn(false);
      setUserData(null);
      
      // Force page refresh
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { href: '/', label: 'Home', icon: <Home className="w-4 h-4 mr-2" /> },
    { href: '/products', label: 'Products', icon: <Book className="w-4 h-4 mr-2" /> },
    { href: '/cart', label: 'Cart', icon: <ShoppingCart className="w-4 h-4 mr-2" /> },
  ];

  // Add this inside your component, right before the return statement
  // This will help diagnose what userData actually contains
  useEffect(() => {
    // Check the exact userData type and content when it changes
    if (userData) {
      console.log("Current userData type:", typeof userData);
      console.log("Current userData value:", userData);
      
      // If userData is a string but should be an object, try to fix it
      if (typeof userData === 'string') {
        try {
          const parsedUser = JSON.parse(userData);
          console.log("Parsed userData from string:", parsedUser);
          setUserData(parsedUser); // Update state with correctly parsed object
        } catch (e) {
          console.error("Failed to parse userData string:", e);
        }
      }
    }
  }, [userData]);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Announcement Bar */}
      <div className="bg-[#1e2c51] text-white text-center text-sm py-2">
        <div className="container mx-auto">
          Get 20% off on all resources this week!
        </div>
      </div>
      
      {/* Top Row - Contact, Search, Auth */}
      <div className="border-b">
        <div className="flex h-12 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
          {/* Phone Number */}
          <div className="flex items-center gap-2 text-muted-foreground hover:text-[#1e2c51] transition-colors cursor-pointer">
            <Phone size={16} className="shrink-0" />
            <span className="text-sm font-medium hidden sm:block">+1 (233) 123-4567</span>
          </div>

          {/* Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative group w-full">
              <Input 
                type="search"
                placeholder="Search resources, exams, universities..."
                className="w-full bg-gray-50/50 border-dashed focus:border-[#1e2c51] pl-10 pr-4 py-1.5 text-sm transition-all focus:ring-[#1e2c51]/20"
              />
              <Search 
                size={16} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[#1e2c51] transition-colors"
              />
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="h-8 px-3 rounded-full bg-[#1e2c51] flex items-center justify-center text-white"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {userData?.name || 'User'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {(() => {
                      // Explicitly handle different scenarios - this self-executing function
                      // lets us do more complex logic directly in JSX
                      console.log("Rendering dropdown with userData:", userData);
                      
                      // Make sure userData is an object
                      const user = typeof userData === 'string' 
                        ? JSON.parse(userData) 
                        : userData;
                      
                      if (!user) return 'My Account';
                      
                      // Show name if available, with email below it
                      return (
                        <div className="flex flex-col">
                          <div className="font-bold">{user.name || 'User'}</div>
                          <div className="text-sm text-muted-foreground">{user.email || 'No email'}</div>
                          {user.role && <div className="text-xs mt-1 px-2 py-0.5 bg-slate-100 rounded-full self-start">{user.role}</div>}
                        </div>
                      );
                    })()}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link href="/auth/login">
                  <Button size="sm" variant="secondary" className="hidden sm:flex">
                    <LogIn size={16} className="mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-gradient-to-r from-[#5d8e9a] to-[#4a7280] hover:from-[#537f8a] hover:to-[#40636f] text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <UserPlus size={16} className="mr-2 hidden sm:inline-flex" />
                    <span className="hidden sm:inline">Sign Up</span>
                    <span className="sm:hidden">Join</span>
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row - Logo and Navigation */}
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        {/* Logo Container */}
        <div className="flex-shrink-0 flex items-center">
          <Link href="/" className="font-bold text-xl text-[#1e2c51]">
            RN Resources
          </Link>
        </div>
        
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0 md:hidden z-20"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-center space-x-1 lg:space-x-6 ml-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-[#1e2c51] relative group",
                pathname === item.href && "text-[#1e2c51]"
              )}
            >
              <div className="flex items-center">
                {item.icon}
                {item.label}
              </div>
              <span className="absolute inset-x-3 -bottom-1 h-0.5 bg-[#1e2c51] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
          ))}
        </div>
        
        <div className="hidden md:flex flex-shrink-0 items-center space-x-4">
          {isLoggedIn && (
            <Link href="/dashboard">
              <Button 
                variant="default" 
                size="sm" 
                className="bg-gradient-to-r from-[#1e2c51] to-[#2a3e6d] hover:from-[#162242] hover:to-[#223459] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                <User className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
          )}
          <Button 
            variant="default" 
            size="sm" 
            className="bg-gradient-to-r from-[#5d8e9a] to-[#4a7280] hover:from-[#537f8a] hover:to-[#40636f] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
          >
            Book Your Exam
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`
        md:hidden fixed inset-x-0 top-[calc(7.5rem)] bottom-0 bg-white z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto
        ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col p-4 space-y-4 pb-24">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className={cn(
                "px-4 py-3 text-lg font-medium text-muted-foreground hover:text-[#1e2c51] hover:bg-gray-50 rounded-lg transition-colors flex items-center",
                pathname === item.href && "text-[#1e2c51] bg-gray-50"
              )}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="px-4 py-3 text-lg font-medium text-muted-foreground hover:text-[#1e2c51] hover:bg-gray-50 rounded-lg transition-colors flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-4 h-4 mr-2" />
                {userData?.name || 'Dashboard'}
              </Link>
              <Button
                variant="ghost"
                className="px-4 py-3 text-lg font-medium text-muted-foreground hover:text-[#1e2c51] hover:bg-gray-50 rounded-lg transition-colors w-full justify-start"
                onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </Button>
            </>
          ) : (
            <div className="pt-4 border-t space-y-3">
              <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="w-full flex items-center justify-center"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                <Button 
                  variant="default" 
                  size="lg" 
                  className="w-full bg-gradient-to-r from-[#5d8e9a] to-[#4a7280] hover:from-[#537f8a] hover:to-[#40636f] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <Button 
              variant="default" 
              size="lg" 
              className="w-full bg-gradient-to-r from-[#5d8e9a] to-[#4a7280] hover:from-[#537f8a] hover:to-[#40636f] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Book Your Exam
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`
          md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300
          ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* Mobile Search - Fixed at bottom */}
      <div className={`
        fixed bottom-0 left-0 right-0 sm:hidden transition-transform duration-300 z-50 bg-white pb-4 px-4 border-t
        ${isMenuOpen ? 'translate-y-full' : 'translate-y-0'}
      `}>
        <div className="relative group w-full pt-4">
          <Input 
            type="search"
            placeholder="Search..."
            className="w-full bg-white border-2 shadow-lg pl-10 pr-4 py-2 text-sm rounded-full"
          />
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
        </div>
      </div>
    </nav>
  );
} 