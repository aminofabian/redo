import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  try {
    // Get raw token data directly
    const token = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET,
      raw: true  // Get the raw token
    });
    
    // Also get the parsed token
    const parsedToken = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    return NextResponse.json({
      rawToken: token,
      parsedToken,
      message: "Use this to debug your token structure"
    });
  } catch (error) {
    console.error("Token debug error:", error);
    return NextResponse.json({ error: "Failed to get token details" }, { status: 500 });
  }
} 