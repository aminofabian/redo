// Most compatible approach
import NextAuth from "next-auth/next";
import { authOptions } from "@/auth";

// Use casting to bypass TypeScript's strict checking
const handler = NextAuth(authOptions as any);
export { handler as GET, handler as POST };
