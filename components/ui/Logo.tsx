"use client";
import { BookOpen } from "lucide-react";
import Link from "next/link";
import React from "react";

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <Link href="/" className={`flex items-center ${className || ''}`}>
      <div className="relative flex items-center">
        <div className="w-10 h-10 bg-gradient-to-br from-[#1e2c51] to-[#1e2c51]/90 rounded-lg flex items-center justify-center mr-2 shadow-md">
          <span className="font-bold text-xl text-white">R</span>
          <span className="font-bold text-xl text-yellow-400">N</span>
        </div>
        <div className="hidden md:block">
          <h1 className="font-bold text-xl text-gray-800">
            <span className="text-[#1e2c51]">RN</span>
            <span>Student</span>
          </h1>
          <p className="text-xs font-medium text-gray-600 -mt-1">
            Resources
          </p>
        </div>
      </div>
    </Link>
  );
};

export default Logo; 