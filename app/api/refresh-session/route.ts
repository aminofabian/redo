import { NextResponse } from "next/server";
import { signOut } from "next-auth/react";

export async function GET() {
  // This will force a new login
  return NextResponse.json({ 
    message: "Please sign out and sign in again to refresh your session",
  });
} 