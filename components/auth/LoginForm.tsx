"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import CardWrapper from "./CardWrapper";
import { useState, useTransition } from "react";
import { login } from "@/actions/login";
import FormError from "../common/FormError";
import FormSuccess from "../common/FormSuccess";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

const LoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "Email already in use with different provider!"
    : "";

  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | undefined>("");
  const [success, setSuccess] = useState<string | undefined>("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: values.email,
          password: values.password,
          redirect: false,
        });
        
        if (result?.error) {
          setError("Invalid credentials");
          return;
        }
        
        setSuccess("Logged in successfully!");
        router.push(callbackUrl || "/dashboard");
        router.refresh();
      } catch (error) {
        setError("Something went wrong!");
      }
    });
  };

  return (
    <div className="w-full">
      <CardWrapper
        headerLabel="Welcome back"
        backButtonLabel="Don't have an account?"
        backButtonHref="/auth/register"
        showSocial
      >
        <Form {...form}>
          <form 
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] font-medium text-gray-700">
                      Email or username
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isPending}
                        placeholder="john.doe@example.com"
                        type="email"
                        className="h-11 bg-white border border-gray-300 rounded-[4px] px-3 
                                 focus:ring-2 focus:ring-offset-1 focus:ring-green-700 focus:border-green-700
                                 placeholder:text-gray-500 text-gray-900"
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-normal mt-1" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-[13px] font-medium text-gray-700">
                        Password
                      </FormLabel>
                      <Link 
                        href="/auth/reset"
                        className="text-[13px] text-green-700 hover:text-green-800 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          disabled={isPending}
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          className="h-11 bg-white border border-gray-300 rounded-[4px] px-3 
                                   focus:ring-2 focus:ring-offset-1 focus:ring-green-700 focus:border-green-700
                                   placeholder:text-gray-500 text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" 
                               className="h-5 w-5 text-gray-400 hover:text-gray-600" 
                               viewBox="0 0 20 20" 
                               fill="currentColor"
                          >
                            {showPassword ? (
                              <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            ) : (
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            )}
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-normal mt-1" />
                  </FormItem>
                )}
              />
            </div>

            <FormError message={error || urlError} />
            <FormSuccess message={success} />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-green-700 hover:bg-green-800 text-white h-11 rounded-[4px]
                        font-medium text-[15px] shadow-sm transition-colors
                        focus:ring-2 focus:ring-offset-1 focus:ring-green-700
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </Form>
      </CardWrapper>
    </div>
  );
};

export default LoginForm;
