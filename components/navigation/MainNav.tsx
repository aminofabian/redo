"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import { Search, Phone, LogIn, UserPlus, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import AnnouncementBar from "@/components/ui/AnnouncementBar";
import LoginButton from "@/components/auth/LoginButton";
import { useState } from "react";

const MainNav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      {/* Announcement Bar */}
      <AnnouncementBar />
      
      {/* Top Row - Contact, Search, Auth */}
      <div className="border-b">
        <div className="flex h-12 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
          {/* Phone Number */}
          <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <Phone size={16} className="shrink-0" />
            <span className="text-sm font-medium hidden sm:block">+1 (233) 123-4567</span>
          </div>

          {/* Search Bar */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4">
            <div className="relative group w-full">
              <Input 
                type="search"
                placeholder="Search resources, exams, universities..."
                className="w-full bg-gray-50/50 border-dashed focus:border-primary pl-10 pr-4 py-1.5 text-sm transition-all focus:ring-primary/20"
              />
              <Search 
                size={16} 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
              />
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LoginButton>
              <Button size="sm" variant="secondary" className="hidden sm:flex">
                Sign In
              </Button>
            </LoginButton>
            <Button 
              variant="default" 
              size="sm" 
              className="bg-gradient-to-r from-[#5d8e9a] to-[#4a7280] hover:from-[#537f8a] hover:to-[#40636f] text-white shadow-md hover:shadow-lg transition-all duration-200"
            >
              <UserPlus size={16} className="mr-2 hidden sm:inline-flex" />
              <span className="hidden sm:inline">Sign Up</span>
              <span className="sm:hidden">Join</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Row - Logo and Navigation */}
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        {/* Logo Container - Improved for better visibility */}
        <div className="flex-shrink-0 w-[120px] md:w-[150px] flex items-center">
          <div className="relative w-full">
            <Logo />
          </div>
        </div>
        
        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="flex-shrink-0 md:hidden z-20"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex flex-1 items-center justify-center space-x-1 lg:space-x-6 ml-4">
          {[
            ['Shop', '/shop'],
            ['Popular', '/popular'],
            ['Categories', '/categories'],
            ['Universities', '/universities'],
            ['More', '/more']
          ].map(([label, href]) => (
            <Link 
              key={href}
              href={href} 
              className="px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary relative group"
            >
              {label}
              <span className="absolute inset-x-3 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
            </Link>
          ))}
        </div>
        
        <div className="hidden md:flex flex-shrink-0 items-center space-x-4">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-r from-[#5d8e9a]/10 to-[#4a7280]/10 text-primary text-sm font-medium">
            0
          </div>
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
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>
        <div className="flex flex-col p-4 space-y-4 pb-24">
          {[
            ['Shop', '/shop'],
            ['Popular', '/popular'],
            ['Categories', '/categories'],
            ['Universities', '/universities'],
            ['More', '/more']
          ].map(([label, href]) => (
            <Link 
              key={href}
              href={href} 
              className="px-4 py-3 text-lg font-medium text-muted-foreground hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {label}
            </Link>
          ))}
          
          <div className="pt-4 border-t space-y-3">
            <Button 
              variant="default" 
              size="lg" 
              className="w-full bg-gradient-to-r from-[#5d8e9a] to-[#4a7280] hover:from-[#537f8a] hover:to-[#40636f] text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
            >
              Book Your Exam
            </Button>
            <div className="flex items-center justify-center w-full h-6 rounded-full bg-gradient-to-r from-[#5d8e9a]/10 to-[#4a7280]/10 text-primary text-sm font-medium">
              0 Items in Cart
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`
          md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300
          ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Search - Fixed at bottom */}
      <div className={`
        fixed bottom-0 left-0 right-0 sm:hidden transition-transform duration-300 z-50 bg-white pb-4 px-4 border-t
        ${mobileMenuOpen ? 'translate-y-full' : 'translate-y-0'}
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
};

export default MainNav; 