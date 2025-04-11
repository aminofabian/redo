import { DefaultSession } from "next-auth";

type UserRole = "ADMIN" | "USER" | "VERIFIED_USER";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: UserRole;
    } & DefaultSession["user"];
    expires: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    role: UserRole;
  }
} 