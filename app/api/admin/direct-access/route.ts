import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { Session } from "next-auth";

type CustomSession = Session & {
  user?: {
    role?: string;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as CustomSession;
    
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const isAdmin = session.user?.role === "ADMIN";
    
    return NextResponse.json({
      isAuthenticated: true,
      isAdmin,
      session,
      message: isAdmin 
        ? "You have admin access" 
        : "You are authenticated but don't have admin role"
    });
  } catch (error) {
    console.error("Error checking direct admin access:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 