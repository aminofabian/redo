import { NextRequest, NextResponse } from 'next/server';
import prismadb from '@/lib/db';
import { auth } from '@/auth';
import { User } from "next-auth";

interface ExtendedUser extends User {
  id: string;
  role: string;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user || (session.user as ExtendedUser).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get search parameter
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    
    // Use a raw query to avoid enum conversion issues
    const rawUsers = await prismadb.$queryRaw`
      SELECT id, name, email, "emailVerified", image, role::text
      FROM users
      WHERE
        name ILIKE ${`%${search}%`} OR
        email ILIKE ${`%${search}%`}
      ORDER BY email
      LIMIT 50
    `;
    
    return NextResponse.json(rawUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
} 