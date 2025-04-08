"use client";

import Link from "next/link";

interface BackButtonProps {
  href: string;
  label: string;
}

const BackButton = ({
  href,
  label,
}: BackButtonProps) => {
  return (
    <div className="mt-6 text-center">
      <Link
        href={href}
        className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
      >
        {label}
      </Link>
    </div>
  );
};

export default BackButton; 