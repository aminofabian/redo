import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  return NextResponse.json({ 
    sessionExists: !!session,
    session: session,
    userExists: !!session?.user,
    userRole: session?.user?.role,
  });
} 