"use client";

import { signOut, signIn } from "next-auth/react";
import { useState } from "react";

export function ForceReauthButton() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const handleForceReauth = async () => {
    setIsSigningOut(true);
    try {
      // First sign out
      await signOut({ redirect: false });
      
      // Clear any localStorage/cookies
      localStorage.clear();
      
      // Then redirect to sign in
      await signIn(undefined, { callbackUrl: "/admin-test" });
    } catch (error) {
      console.error("Reauthentication error:", error);
      setIsSigningOut(false);
    }
  };
  
  return (
    <button
      onClick={handleForceReauth}
      disabled={isSigningOut}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
    >
      {isSigningOut ? "Processing..." : "Force Sign Out & Sign In"}
    </button>
  );
} 