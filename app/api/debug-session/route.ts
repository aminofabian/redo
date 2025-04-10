import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Define a type for the session object
interface UserSession {
  user?: {
    name?: string;
    email?: string;
    id?: string;
    role?: string;
    emailVerified?: Date | null;
    [key: string]: any; // For any other properties
  };
}

export async function GET(request: Request) {
  // Use the auth() function directly which should handle the session properly
  const session = await auth() as UserSession | null;
  
  return NextResponse.json({
    authenticated: !!session,
    session,
    user: session?.user || null,
  });
} 