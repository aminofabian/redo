"use server";

import { getUserByEmail } from "@/data/user";
import { getVerificationTokenByToken } from "@/data/verification-token";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { signIn, signOut } from "next-auth/react";

export const verifyEmail = async (token: string) => {
  const existingToken = await getVerificationTokenByToken(token);

  if (!existingToken) {
    return { error: "Token does not exist!" };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: "Token has expired!" };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: "Email does not exist!" };
  }

  await prisma.user.update({
    where: { id: existingUser.id },
    data: { 
      emailVerified: new Date(),
      role: "VERIFIED_USER"  // Update role to VERIFIED_USER after verification
    }
  });

  await prisma.verificationToken.delete({
    where: { id: existingToken.id }
  });

  return { success: "Email verified successfully!" };
}; 