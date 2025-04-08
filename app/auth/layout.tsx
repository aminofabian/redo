import LoginSide from "@/components/auth/LoginSide";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          {/* You can add your logo here */}
          <img
            alt="Logo"
            src="/logo.png"
            className="h-12 w-auto"
          />
        </div>
        {children}
      </div>
    </div>
  );
}
