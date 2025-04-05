"use client";

import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { Button } from "../ui/button";
import { FaFacebook, FaGoogle } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

const Social = () => {
  const onClick = (provider: "google" | "github") => {
    signIn(provider, {
      callbackUrl: DEFAULT_LOGIN_REDIRECT,
    });
  };
  return (
    <div className="flex items-center w-full gap-x-2 justify-center">
      <Button
        className="w-full"
        variant="outline"
        onClick={() => onClick("github")}
      >
        <GitHubLogoIcon className="w-4" />
      </Button>
      <Button
        className="w-full"
        variant="outline"
        onClick={() => onClick("google")}
      >
        <FaGoogle />
      </Button>
      <Button className="w-full" variant="outline">
        <FaFacebook />
      </Button>
    </div>
  );
};

export default Social;
