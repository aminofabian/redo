import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    return NextResponse.json({
      session,
      message: "Use this to debug your session structure"
    });
  } catch (error) {
    console.error("Token debug error:", error);
    return NextResponse.json({ error: "Failed to get session details" }, { status: 500 });
  }
} 