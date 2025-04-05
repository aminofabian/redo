"use client";

import * as z from "zod";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import FormError from "../common/FormError";
import FormSuccess from "../common/FormSuccess";
import { login } from "@/actions/login";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";


import CardWrapper from "./CardWrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema } from "@/schemas";
import {
  Form,
  FormControl,
  FormLabel,
  FormItem,
  FormField,
  FormMessage,
} from "../ui/form";

const LoginForm = () => {
  const searchParams = useSearchParams();
  const urLError =
  searchParams.get("error") === "OAuthAccountNotLinked"
  ? "Email Already in Use with a Different Provider"
  : "";
  
  const [isPending, startTransition] = useTransition();
  
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  
  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSuccess("");
    
    startTransition(() => {
      login(values)
      .then((data) => {
        if (data?.error) {
          form.reset();
          setError(data?.error);
        }
        
        if (data?.success) {
          form.reset();
          setSuccess(data?.success);
        }
        
        // if (data?.twoFactor) {
        //   setShowTwoFactor(true);
        // }
      })
      .catch(() => setError("Something went wrong"));
    });
  };
  return (
    <div className="text-slate-50">
    <CardWrapper
    headerLabel="Welcome Back"
    backButtonLabel="Don't Have an Account?"
    backButtonHref="/auth/register"
    showSocial
    >
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <div className="space-y-4">
    <FormField
    control={form.control}
    name="email"
    render={({ field }) => (
      <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
      <Input
      disabled={isPending}
      {...field}
      placeholder="john.doe@example.com"
      type="email"
      />
      </FormControl>
      <FormMessage className="text-xm text-orange-400 font-light" />
      </FormItem>
    )}
    />
    <FormField
    control={form.control}
    name="password"
    render={({ field }) => (
      <FormItem>
      <FormLabel>Password</FormLabel>
      <FormControl>
      <Input
      {...field}
      placeholder="1234567"
      disabled={isPending}
      type="password"
      />
      </FormControl>
      <FormMessage className="text-xm text-orange-400 font-light" />
      </FormItem>
    )}
    />
    </div>
    <FormError message={error || urLError} />
    <FormSuccess message={success} />
    <Button size="sm" variant="link" className="px-0 font-normal">
    <Link href='/auth/reset'>
    Forgot Password?
    </Link>
    </Button>
    <Button
    variant="default"
    type="submit"
    className="w-full"
    disabled={isPending}
    >
    Login into Your Account
    </Button>
    </form>
    </Form>
    </CardWrapper>
    </div>
  );
};

export default LoginForm;
