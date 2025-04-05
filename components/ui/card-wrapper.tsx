import React from "react";
import Link from "next/link";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
}

export const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
}: CardWrapperProps) => {
  return (
    <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-sm">
      <div className="mb-4 text-center">
        <h2 className="text-2xl font-semibold">{headerLabel}</h2>
      </div>
      <div className="mb-4">{children}</div>
      <div className="text-center">
        <Link
          href={backButtonHref}
          className="text-sm text-gray-600 hover:underline"
        >
          {backButtonLabel}
        </Link>
      </div>
    </div>
  );
}; 