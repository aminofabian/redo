import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { getUserByEmail } from "@/data/user";
import { UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authConfig } from "@/lib/auth-config";

// Import correct types
import type { Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";

// Use inferred typing
export const authOptions = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      // Enable debug logging
      console.log("JWT callback - user:", user);
      console.log("JWT callback - token before:", token);
      
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      
      console.log("JWT callback - token after:", token);
      return token;
    },
    session({ session, token }: { session: any; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string || undefined;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
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
        
        // Log successful login with role info
        console.log("User authenticated:", { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        });
        
        return user;
      }
    })
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt" as const
  },
  debug: process.env.NODE_ENV === "development",
} as any;

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
    name?: string;
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
    // @ts-ignore - Session object is validated at runtime but TypeScript doesn't recognize it
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

async function getSession(): Promise<Session | null> {
  // Cast authConfig to any to bypass strict type checking
  return await getServerSession(authConfig as any);
}
