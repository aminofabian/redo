import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db";

/**
 * Generate a verification token for email verification
 */
export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await db.verificationToken.findFirst({
    where: { email }
  });

  if (existingToken) {
    await db.verificationToken.delete({
      where: { id: existingToken.id }
    });
  }

  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  return verificationToken;
};

/**
 * Generate a password reset token
 */
export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(new Date().getTime() + 3600 * 1000); // 1 hour

  const existingToken = await db.passwordResetToken.findFirst({
    where: { email }
  });

  if (existingToken) {
    await db.passwordResetToken.delete({
      where: { id: existingToken.id }
    });
  }

  const resetToken = await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires
    }
  });

  return resetToken;
}; 