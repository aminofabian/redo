"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut, SessionProvider } from "next-auth/react";
import { Menu, X, User, LogIn, LogOut, Book, Home, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Create a separate component that uses the session
function NavbarContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  const firstName = (session?.user as any)?.firstName || session?.user?.name?.split(' ')[0] || '';

  const navItems = [
    { name: "Home", path: "/", icon: Home },
    { name: "Store", path: "/store", icon: ShoppingCart },
    { name: "Resources", path: "/resources", icon: Book },
  ];
  
  const authItems = session ? [
    { name: "Dashboard", path: "/dashboard", icon: User },
  ] : [
    { name: "Login", path: "/auth/login", icon: LogIn },
    { name: "Register", path: "/auth/register", icon: User },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="flex items-center">
            <span className="text-xl font-bold text-[#1e2c51]">RN Students Resources</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#1e2c51]",
                isActive(item.path) 
                  ? "text-[#1e2c51] font-semibold" 
                  : "text-gray-600"
              )}
            >
              {item.name}
            </Link>
          ))}
          
          {!session && authItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#1e2c51]",
                isActive(item.path) 
                  ? "text-[#1e2c51] font-semibold" 
                  : "text-gray-600"
              )}
            >
              {item.name}
            </Link>
          ))}
          
          {session && (
            <>
              <Link
                href="/dashboard"
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[#1e2c51]",
                  isActive("/dashboard") 
                    ? "text-[#1e2c51] font-semibold" 
                    : "text-gray-600"
                )}
              >
                Dashboard
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session?.user?.image || ""} />
                      <AvatarFallback className="bg-[#1e2c51] text-white">
                        {firstName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{session.user?.name || firstName}</DropdownMenuLabel>
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
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t py-4">
          <nav className="container flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#1e2c51]",
                  isActive(item.path) 
                    ? "text-[#1e2c51] font-semibold" 
                    : "text-gray-600"
                )}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
            
            {!session ? (
              authItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#1e2c51]",
                    isActive(item.path) 
                      ? "text-[#1e2c51] font-semibold" 
                      : "text-gray-600"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              ))
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-[#1e2c51]",
                    isActive("/dashboard") 
                      ? "text-[#1e2c51] font-semibold" 
                      : "text-gray-600"
                  )}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 transition-colors hover:text-[#1e2c51]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Profile
                </Link>
                <button
                  className="flex items-center gap-2 text-sm font-medium text-red-600 transition-colors hover:text-red-800"
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

// Wrap the component with SessionProvider
export function Navbar() {
  return (
    <SessionProvider>
      <NavbarContent />
    </SessionProvider>
  );
} 