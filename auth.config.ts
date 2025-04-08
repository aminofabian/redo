import type { AuthConfig } from "@auth/core";
import Credentials from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { getUserByEmail } from "@/data/user";

export const authConfig = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    {
      id: "credentials",
      name: "Credentials",
      type: "credentials",
      credentials: {
        email: { type: "email" },
        password: { type: "password" }
      },
      async authorize(credentials, req) {
        // Type assertion to work with our expected types
        const { email, password } = credentials as Record<string, string>;
        if (!email || !password) return null;

        const user = await getUserByEmail(email);
        if (!user?.password) return null;

        const isValid = await bcryptjs.compare(password, user.password);
        if (!isValid) return null;
        
        return user;
      }
    }
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ token, session }: { token: any; session: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  }
} satisfies AuthConfig;