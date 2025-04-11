import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      isAuthenticated: !!session,
      session,
      message: "Use this to debug your auth state"
    });
  } catch (error) {
    console.error("Auth debug error:", error);
    return NextResponse.json({ error: "Failed to get auth details" }, { status: 500 });
  }
} 