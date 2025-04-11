"use server";

import * as z from "zod";
import { LoginSchema } from "@/schemas";
import { signIn } from "@/auth";
import { AuthError } from "@auth/core/errors";

export const login = async (values: z.infer<typeof LoginSchema>) => {
  try {
    const validatedFields = LoginSchema.safeParse(values);
    
    if (!validatedFields.success) {
      return { error: "Please check your email and password" };
    }

    const { email, password } = validatedFields.data;

    // Attempt to sign in (don't check for email verification here)
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });

    if (result?.error) {
      console.error("SignIn error:", result.error);
      return { error: "Invalid email or password" };
    }

    return { success: "Welcome back!" };
  } catch (error) {
    console.error("Login error:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
};