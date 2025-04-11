import 'next-auth';
import { UserRole } from '@prisma/client';
import NextAuth from "next-auth";

declare module 'next-auth' {
  interface User {
    firstName?: string;
    lastName?: string;
    role?: string;
    id?: string;
    // Add any other custom properties here
  }
  
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string;
      role: "USER" | "ADMIN";
    };
    expires: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
  }
} 