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
    const response = NextResponse.next();
    
    // Get existing CSP header
    const cspHeader = response.headers.get('content-security-policy') || '';
    
    // Add S3 bucket to img-src directive
    const updatedCspHeader = cspHeader.replace(
      /img-src 'self' data: https:\/\/\*\.paypal\.com/,
      "img-src 'self' data: https://*.paypal.com https://alexawriters.s3.eu-north-1.amazonaws.com"
    );
    
    // Set the updated header
    response.headers.set('content-security-policy', updatedCspHeader);
    
    return response;
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
