import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

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
  // Type assertion to help TypeScript understand the session structure
  const session = await getServerSession(authOptions) as UserSession | null;
  
  return NextResponse.json({
    authenticated: !!session,
    session,
    user: session?.user || null,
  });
} 