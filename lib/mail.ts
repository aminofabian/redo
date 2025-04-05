import { Resend } from "resend";

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);
export const sendPasswordResetEmail = async (
  email: string,
  token: string,
) => {
  const resetLink = `http://localhost:3000/auth/new-password?token=${token}`;
  await resend.emails.send({
    from: "onboading@resend.dev",
    to: email,
    subject: "Reset Your Password",
    html: ` <p>Please click the link below to Reset your Password
    <a href="${resetLink}">Click Here</a>
    </p>`
  });
};


export const sendVerificationEmail = async (
  email: string,
  token: string) => {
  const confirmLink = `http://localhost:3000/auth/new-verification?token=${token}`;
  await resend.emails.send({
    from: "onboading@resend.dev",
    to: email,
    subject: "Verify your email",
    html: ` <p>Please click the link below to verify your email
    <a href="${confirmLink}">Click Here</a>
    </p>`,
  });
};



