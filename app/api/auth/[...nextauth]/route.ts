// Most compatible approach
import { authOptions } from "@/auth";
import NextAuth from "next-auth/next";

// Use type assertion to override readonly constraint
const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
