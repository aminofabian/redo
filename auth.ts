import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { UserRole } from "@prisma/client";
import { getSession } from "@/lib/auth";

// Import correct types
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import { getServerSession } from "next-auth/next";
// Import the correct config type

// Configure your auth providers and options
export const authOptions = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      console.log("JWT callback - user:", user);
      console.log("JWT callback - token before:", token);
      
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.role = user.role;
      }
      
      console.log("JWT callback - token after:", token);
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log("Session callback - token:", token);
      console.log("Session callback - session before:", session);
      
      if (token && session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
      }
      
      console.log("Session callback - session after:", session);
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
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
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await getUserByEmail(credentials.email as string);
        if (!user || !user.password) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordMatch) return null;
        return user;
      }
    })
  ],
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" }
} as const;

// Type for the session including user id and role
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | undefined;
      role: UserRole;
    }
  }
  
  interface User {
    id: string;
    email: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: UserRole;
  }
}

// Export a utility function for API routes
export async function withAuth(
  req: Request, 
  handler?: (req: Request, session: Session) => Promise<Response>
) {
  const session = await getSession();
  
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

// Add a debugging version of the auth function
export async function auth() {
  // Deep clone to make all properties mutable
  const mutableOptions = JSON.parse(JSON.stringify(authOptions));
  const session = await getServerSession(mutableOptions);
  console.log("Auth function called, returning session:", session);
  return session;
}
