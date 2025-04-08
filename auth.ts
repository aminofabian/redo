import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getUserByEmail } from "@/data/user";

// This is a workaround for the NextAuth type issue
import type { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";

export const authConfig = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same-origin URLs
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl + "/dashboard";
    }
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email);
        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) return null;
        return user;
      }
    })
  ],
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" }
} satisfies NextAuthConfig;

// Create a simple handler that exposes the auth functions
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export auth for middleware usage
export const getServerAuthSession = auth;

// Export a utility function for API routes
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
