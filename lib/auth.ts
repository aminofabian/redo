// Remove all comment lines at the top
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma  from "./db";
import { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import { authConfig } from "./auth-config";
import { signOut as nextAuthSignOut } from "next-auth/react";

// Create a simple session response
export async function GET(request: Request) {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/auth", "");
  
  // Handle session endpoint
  if (path === "/session") {
    // Check for actual session cookie in the request
    const cookieHeader = request.headers.get('cookie') || '';
    const hasAuthCookie = 
      cookieHeader.includes('next-auth.session-token') ||
      cookieHeader.includes('__Secure-next-auth.session-token');
    
    if (hasAuthCookie) {
      try {
        // Extract the session token 
        const sessionTokenMatch = cookieHeader.match(/next-auth\.session-token=([^;]+)/);
        const secureTokenMatch = cookieHeader.match(/__Secure-next-auth\.session-token=([^;]+)/);
        const sessionToken = sessionTokenMatch?.[1] || secureTokenMatch?.[1];
        
        // Try to get email from cookie (this is the key addition)
        const cookies = parseCookies(cookieHeader);
        const email = cookies['email'] || cookies['user_email'] || getCookieValue(cookieHeader, 'user.email');
        
        if (email) {
          // Try to get the user by email
          const user = await prisma.user.findUnique({
            where: { email },
            select: { 
              id: true, 
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          });
          
          if (user) {
            console.log("Found user by email:", user); // Debug output
            const name = formatName(user.firstName, user.lastName);
            
            return new Response(
              JSON.stringify({ 
                user: { 
                  id: user.id,
                  email: user.email,
                  name: name,
                  role: user.role
                } 
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
        
        // Direct database lookup failed, try to extract email from token if possible
        // Fall back to a decent name if we can find any identifier
        let fallbackName = "User";
        const emailFromCookies = extractEmailFromCookies(cookieHeader);
        if (emailFromCookies) {
          fallbackName = extractNameFromEmail(emailFromCookies);
        }
        
        return new Response(
          JSON.stringify({ 
            user: { 
              name: fallbackName,
              email: emailFromCookies || "user@example.com",
              role: "USER"
            } 
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error("Error retrieving session data:", error);
      }
    }
    
    return new Response(
      JSON.stringify({ user: null }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // Handle signin endpoint
  if (path === "/signin" || path === "/login") {
    return Response.redirect(new URL("/auth/login", url.origin));
  }
  
  // Handle signout endpoint
  if (path === "/signout" || path === "/logout") {
    // Clear all cookies
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Set-Cookie': [
        'next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
        'auth-status=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;',
        'next-auth.callback-url=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
        'next-auth.csrf-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly',
        '__Secure-next-auth.session-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure',
      ].join(', ')
    });
    
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers }
    );
  }
  
  // Default response for other auth endpoints
  return new Response(
    JSON.stringify({ error: "Not implemented" }),
    { 
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

// Helper function to get a cookie value
function getCookieValue(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Helper function to parse all cookies into an object
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=');
      cookies[name] = decodeURIComponent(value);
    }
  });
  
  return cookies;
}

// Helper to extract and format name from email
function extractNameFromEmail(email: string): string {
  // Get the part before the @ sign
  const parts = email.split('@')[0];
  
  // Check if it looks like "firstlast" or "first.last"
  const nameParts = parts.replace(/[._-]/g, ' ').trim().split(/\s+/);
  
  return nameParts
    .map(word => word.charAt(0).toUpperCase() + word.toLowerCase().slice(1))
    .join(' ');
}

// Look for any cookie that might contain an email
function extractEmailFromCookies(cookieHeader: string): string | null {
  const cookies = parseCookies(cookieHeader);
  
  // Check for JSON-formatted values in cookies
  for (const [key, value] of Object.entries(cookies)) {
    // Try to parse possible JSON values
    if (value.startsWith('{') && (value.includes('email') || key.includes('email'))) {
      try {
        const parsed = JSON.parse(value.replace(/\\/g, ''));
        if (parsed.email && typeof parsed.email === 'string') {
          return parsed.email;
        }
      } catch (e) {
        // Handle partial JSON
        const emailMatch = value.match(/"email"\s*:\s*"([^"]+)/);
        if (emailMatch && emailMatch[1]) {
          return emailMatch[1];
        }
      }
    }
    
    // Check for plain email values
    if (value.includes('@')) {
      return value;
    }
    
    // Check for URL-encoded JSON
    if (value.includes('%7B') && value.includes('%22email%22')) {
      try {
        const decoded = decodeURIComponent(value);
        const emailMatch = decoded.match(/"email"\s*:\s*"([^"]+)/);
        if (emailMatch && emailMatch[1]) {
          return emailMatch[1];
        }
      } catch (e) {
        // Ignore decoding errors
      }
    }
  }
  
  return null;
}

// Same handler for POST requests
export async function POST(request: Request) {
  return await GET(request);
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  // Your existing auth providers...
  
  callbacks: {
    session: async ({ session, user }: { session: Session; user: any }) => {
      if (session.user) {
        // Get the database user with firstName and lastName
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, email: true, firstName: true, lastName: true, role: true }
        });
        
        // Combine firstName and lastName into a full name
        session.user.name = formatName(dbUser?.firstName, dbUser?.lastName);
          
        session.user.id = user.id;
        session.user.role = dbUser?.role || "USER";
      }
      
      return session;
    },
    // ...other callbacks
  },
  // ...other options
};

// Better name formatting function with proper capitalization
function formatName(firstName?: string | null, lastName?: string | null): string {
  // Ensure proper capitalization of first and last name
  const formatWord = (word?: string | null) => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
  };
  
  const formattedFirstName = formatWord(firstName);
  const formattedLastName = formatWord(lastName);
  
  if (formattedFirstName && formattedLastName) {
    return `${formattedFirstName} ${formattedLastName}`;
  }
  
  return formattedFirstName || formattedLastName || "User";
}

export async function getSession() {
  return await getServerSession({
    ...authConfig,
    session: {
      strategy: "jwt"
    }
  });
}

export const auth = () => getSession();

export async function withAuth(
  req: Request, 
  handler?: (req: Request, session: Session) => Promise<Response>
) {
  const session = await auth();
  
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  if (handler) {
    return handler(req, session);
  }
  
  return new Response(JSON.stringify(session), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}

// Re-export signOut function
export const signOut = () => nextAuthSignOut({ callbackUrl: "/" }); 