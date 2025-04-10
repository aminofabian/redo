import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth'; // Use the auth() function instead of getServerSession

// Define a type for the session object
interface UserSession {
  user?: {
    name?: string;
    email?: string;
    id?: string;
    role?: string;
    emailVerified?: Date | null;
    [key: string]: any;
  };
}

// Export the handler functions to make this a proper module
export async function GET(request: Request) {
  const session = await auth() as UserSession | null;
  
  if (!session) {
    return new NextResponse(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
  
  // Return user profile data from the session
  return new NextResponse(
    JSON.stringify({ user: session.user }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

export async function PUT(request: Request) {
  const session = await auth() as UserSession | null;
  
  if (!session) {
    return new NextResponse(
      JSON.stringify({ error: "Not authenticated" }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    );
  }
  
  try {
    const data = await request.json();
    
    // Handle profile update logic
    
    return new NextResponse(
      JSON.stringify({ success: true, user: data }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: "Failed to update profile" }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
} 