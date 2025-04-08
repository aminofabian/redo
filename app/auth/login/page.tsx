"use client";

import LoginForm from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";

export default function LoginPage() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }
  
  return (
    <div className="w-full">
      <LoginForm />
    </div>
  );
}
