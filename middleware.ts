import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Public paths that don't require authentication
  const publicPaths = ['/auth/login', '/auth/register', '/auth/error'];
  const isPublicPath = publicPaths.includes(request.nextUrl.pathname);
  
  // If not logged in and not on a public path
  if (!session && !isPublicPath) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url));
  }

  // If logged in and on an auth page
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|public).*)'],
};
