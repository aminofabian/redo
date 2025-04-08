"use client";

import { verifyEmail } from "@/actions/verify-email";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { BeatLoader } from "react-spinners";
import CardWrapper from "@/components/auth/CardWrapper";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      return;
    }

    verifyEmail(token)
      .then((result) => {
        if (result.error) {
          toast.error(result.error);
        }

        if (result.success) {
          toast.success(result.success);
          router.push("/auth/login");
        }
      })
      .catch(() => {
        toast.error("Something went wrong!");
      });
  }, [token]);

  return (
    <div>
      <CardWrapper
        headerLabel="Confirming your verification"
        backButtonLabel="Back to login"
        backButtonHref="/auth/login"
      >
        <div className="flex items-center w-full justify-center">
          <BeatLoader />
        </div>
      </CardWrapper>
    </div>
  );
} 