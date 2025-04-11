"use server";
import * as z from "zod";
import bcrypt from "bcryptjs";
import { createUser } from "@/lib/db-adapter";
import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";
import { RegisterSchema } from "@/schemas";
import { getUserByEmail } from "@/data/user";
import { generateVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/mail";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validatedFields = RegisterSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: "Invalid fields!" };
  }

  const { email, password, firstName, lastName } = validatedFields.data;
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Check if user already exists
  const existingUser = await getUserByEmail(email);
  
  if (existingUser) {
    return { error: "Email already in use!" };
  }
  
  try {
    // Use custom function to create user without relying on Prisma defaults
    const user = await createUser({
      id: uuidv4(),
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "USER",
      isTwoFactorEnabled: false
    });
    
    // Generate verification token
    const verificationToken = await generateVerificationToken(email);
    
    // Send verification email
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token
    );
    
    return { success: "Confirmation email sent!" };
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    return { error: "Something went wrong during registration." };
  }
};
