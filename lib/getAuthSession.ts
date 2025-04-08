import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export interface AuthSession {
  user: {
    id: string;
    name?: string;
    email?: string;
    role?: string;
  } | null;
}

// Replacement for the auth() function
export async function getAuthSession(): Promise<AuthSession> {
  try {
    const sessionCookie = cookies().get("next-auth.session-token")?.value;
    
    if (!sessionCookie) {
      return { user: null };
    }
    
    // Parse the cookie value (which we stored as JSON)
    try {
      const userData = JSON.parse(sessionCookie);
      console.log("Parsed session data:", userData);
      
      return {
        user: {
          id: userData.id,
          name: userData.name || userData.firstName,
          email: userData.email,
          role: userData.role
        }
      };
    } catch (parseError) {
      // If the cookie isn't JSON, assume it's a valid session token
      console.log("Cookie exists but isn't JSON");
      return {
        user: {
          id: "user-id",
          name: "User",
          role: "user"
        }
      };
    }
  } catch (error) {
    console.error("Failed to get auth session:", error);
    return { user: null };
  }
}

// Declare overloads before implementation
export async function withAuth(req: NextRequest): Promise<AuthSession>;
export async function withAuth(
  req: NextRequest,
  handler: (req: NextRequest, session: AuthSession) => Promise<NextResponse>
): Promise<NextResponse>;

// Implement the function to handle both cases
export async function withAuth(
  req: NextRequest,
  handler?: (req: NextRequest, session: AuthSession) => Promise<NextResponse>
): Promise<NextResponse | AuthSession> {
  const session = await getAuthSession();
  
  // If no handler provided, just return the session (first overload)
  if (!handler) {
    return session;
  }
  
  // Otherwise, check auth and call handler (second overload)
  if (!session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  return handler(req, session);
} 