import { type AuthConfig } from "@auth/core";
import CredentialsProvider from "@auth/core/providers/credentials";
import bcryptjs from "bcryptjs";
import { getUserByEmail } from "@/data/user";

export const authConfig = {
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          // Basic validation
          const email = credentials?.email;
          const password = credentials?.password;
          
          if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            console.log("Missing or invalid credentials");
            return null;
          }

          // Get user from database
          const user = await getUserByEmail(email);
          console.log("DB user found:", !!user);
          
          if (!user || !user.password) {
            console.log("User not found or has no password");
            return null;
          }

          // Check password
          const isValid = await bcryptjs.compare(password, user.password);
          console.log("Password valid:", isValid);
          
          if (!isValid) {
            console.log("Invalid password");
            return null;
          }

          // Skip email verification check for now to debug
          // if (!user.emailVerified) {
          //   console.log("Email not verified");
          //   return null;
          // }

          // Return user without sensitive data
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null; // Don't throw errors, return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.role = token.role;
      }
      return session;
    }
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: true, // Enable debug mode
} satisfies AuthConfig;