import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Import the getToken function which is more compatible with middleware
import { getToken } from "next-auth/jwt";

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
  
  // Check if this is a protected non-admin route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Add this condition to your middleware
  const isUtilityRoute = utilityRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Skip middleware for public routes
  if (!pathname.startsWith("/admin") && !isProtectedRoute && !isUtilityRoute) {
    return NextResponse.next();
  }
  
  try {
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET
    });
    
    // Debug log
    console.log(`MIDDLEWARE - Token for ${pathname}:`, token);
    
    // Authentication check for all protected routes
    if (!token) {
      console.log(`MIDDLEWARE - No token found for ${pathname}, redirecting to login`);
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    // Additional admin role check only for admin routes
    if (pathname.startsWith("/admin") && (token.role as string) !== "ADMIN") {
      console.log("MIDDLEWARE - Admin access denied. Role details:", {
        actualRole: token.role,
        roleType: typeof token.role,
        expectedRole: "ADMIN",
        comparison: (token.role as string) === "ADMIN",
        stringComparison: String(token.role) === "ADMIN"
      });
      
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // All checks passed
    console.log("MIDDLEWARE - Access granted to path:", pathname);
    return NextResponse.next();
  } catch (error) {
    console.error("MIDDLEWARE - Error checking auth:", error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}

export const config = {
  matcher: [
    '/admin',  // Add the exact route without trailing path
    '/admin/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/account/:path*',
    '/purchases/:path*',
    '/favorites/:path*'
  ],
};
