"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import NewPasswordForm from "@/components/auth/NewPasswordForm";

// Create a client component that uses searchParams
function NewPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  // Your existing password reset logic here
  
  return (
    <div>
      {/* Your existing UI for password reset */}
    </div>
  );
}

// Wrap the client component with Suspense in the page component
export default function NewPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewPasswordClient />
    </Suspense>
  );
}