import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// Import the getToken function which is more compatible with middleware
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  // Use getToken instead of auth() in middleware
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // Public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/register', '/auth/error'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  
  // If not logged in and not on a public path
  if (!token && !isPublicPath) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url));
  }

  // If logged in and on an auth page
  if (token && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
