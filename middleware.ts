import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Import the getToken function which is more compatible with middleware
import { getToken } from "next-auth/jwt";
import { 
  publicRoutes, 
  authRoutes, 
  apiAuthPrefix, 
  DEFAULT_LOGIN_REDIRECT 
} from "./routes";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is in public routes
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if the path is in auth routes (login, register, etc.)
  const isAuthRoute = authRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
  
  // Check if it's an API auth route
  const isApiAuthRoute = pathname.startsWith(apiAuthPrefix);
  
  // Allow all API routes to proceed without redirect
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  
  // Always allow public assets
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/images") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }
  
  // Allow public routes without auth
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // Get auth token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // If on an auth route and logged in, redirect to dashboard
  if (isAuthRoute) {
    if (token) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, request.url));
    }
    // Not logged in on auth route - allow access
    return NextResponse.next();
  }
  
  // Protected route handling
  if (!token) {
    // Save the current URL to redirect back after login
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url));
  }
  
  // Check for role-based access (example for admin routes)
  if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  
  // Allow access to protected routes for authenticated users
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image).*)'],
};
