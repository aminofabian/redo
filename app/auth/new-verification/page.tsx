"use client";

import { useCallback, useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";
import { useSearchParams } from "next/navigation";
import { CardWrapper } from "@/components/auth/card-wrapper";
import { verifyEmail } from "@/actions/verify-email";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

// Create a client component that uses searchParams
function NewVerificationClient() {
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const onSubmit = useCallback(async () => {
    if (!token) {
      toast.error("Missing token!");
      return;
    }

    try {
      const response = await verifyEmail(token);

      if (response?.error) {
        toast.error(response.error);
      }

      if (response?.success) {
        toast.success(response.success);
        router.push("/auth/login");
      }
    } catch (error) {
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  }, [token, router]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <CardWrapper
      headerLabel="Confirming your verification"
      backButtonLabel="Back to login"
      backButtonHref="/auth/login"
    >
      <div className="flex items-center w-full justify-center">
        {loading ? (
          <BeatLoader />
        ) : (
          <p className="text-sm">Token verification complete!</p>
        )}
      </div>
    </CardWrapper>
  );
}

// Wrap the client component with Suspense in the page component
export default function NewVerificationPage() {
  return (
    <Suspense fallback={<div>Loading verification...</div>}>
      <NewVerificationClient />
    </Suspense>
  );
}