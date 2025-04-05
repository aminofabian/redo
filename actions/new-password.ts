"use server"
import * as z from "zod";
import { NewPasswordSchema } from "@/schemas";
import { getPasswordResetTokenByToken } from "@/data/password-reset-token";
import { getUserByEmail } from "@/data/user";
import bcryptjs from "bcryptjs"
import db from "@/lib/db"
export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null,


) => {
  if (!token) {
    return {
      error: "Missing Token!"

    }

  }

  const validatedFields = NewPasswordSchema.safeParse(values)
  if (!validatedFields.success) {
    return { error: "Invalid Fields" }
  }

  const { password } = validatedFields.data;

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return {
      error: "Invalid Token"
    }

  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return {
      error: "The Token is Expired"
    }

  }

  const existingUser = await getUserByEmail(existingToken.email)

  if (!existingUser) {
    return {
      error: "the user doesn't exist"

    }

  }

  const hashedPassword = await bcryptjs.hash(password, 10)

  await db.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  });

  await db.passwordResetToken.delete({
    where: { id: existingToken.id }

  })

  return {
    success: "You've successfully changed your password"

  }

};