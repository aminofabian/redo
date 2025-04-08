"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import Header from "./Header";
import { Jost } from "next/font/google";
import Social from "./Social";
import BackButton from "./back-button";

interface CardWrapperProps {
  children: React.ReactNode;
  headerLabel: string;
  backButtonLabel: string;
  backButtonHref: string;
  showSocial?: boolean;
}

const font = Jost({
  subsets: ["latin"],
  weight: ["700"],
});

const CardWrapper = ({
  children,
  headerLabel,
  backButtonLabel,
  backButtonHref,
  showSocial,
}: CardWrapperProps) => {
  return (
    <Card className="w-full shadow-lg border-gray-100 bg-white rounded-lg">
      <div className="px-8 pt-6 pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 text-center">
            {headerLabel}
          </h1>
        </div>
        {showSocial && (
          <div className="mb-6">
            <Social />
          </div>
        )}
        {showSocial && (
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>
        )}
        {children}
        <BackButton
          label={backButtonLabel}
          href={backButtonHref}
        />
      </div>
    </Card>
  );
};

export default CardWrapper;