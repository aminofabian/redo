import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/auth";

export async function GET(req: Request) {
  try {
    // Get the session directly
    const session = await getServerSession(authOptions);
    
    // Also get the raw token
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    return NextResponse.json({
      isAuthenticated: !!session,
      session,
      token,
      message: "Use this to debug your auth state"
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json({ error: "Failed to get auth details" }, { status: 500 });
  }
} 