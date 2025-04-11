import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
// Import the getToken function which is more compatible with middleware

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/account', '/purchases', '/favorites', '/admin'];

// Debugging/utility routes that should bypass auth checks
const utilityRoutes = [
  '/admin-direct-login',
  '/auth-debug',
  '/api/debug',
  '/api/admin/force-admin'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (!pathname.startsWith("/dashboard") && 
      !pathname.startsWith("/admin") && 
      !pathname.startsWith("/account")) {
    return NextResponse.next();
  }
  
  try {
    // Get the session token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    
    console.log("MIDDLEWARE - Token check:", {
      path: pathname,
      hasToken: !!token,
      tokenData: token
    });
    
    // No token = not authenticated
    if (!token) {
      console.log("MIDDLEWARE - No token, redirecting to login");
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Check for admin routes
    if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
      console.log("MIDDLEWARE - Not admin, redirecting to dashboard");
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // User is authenticated and has proper access
    return NextResponse.next();
  } catch (error) {
    console.error("MIDDLEWARE - Error:", error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/account/:path*',
  ],
};
