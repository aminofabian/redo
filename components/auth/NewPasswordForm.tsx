"use client";

import * as z from "zod";

import CardWrapper from "./CardWrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NewPasswordSchema } from "@/schemas";
import {
  Form,
  FormControl,
  FormLabel,
  FormItem,
  FormField,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import FormSuccess from "../common/FormSuccess";
import { useState, useTransition } from "react";
import { newPassword } from "@/actions/new-password";
import FormError from "../common/FormError";
import { useSearchParams } from "next/navigation";

const NewPasswordForm= () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isPending, startTransition] = useTransition();
  
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  
  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      newPassword(values, token)
      .then((data) => {
        setError(data?.error);
        setSuccess(data?.success);
      });
    }); 
  };
  return (
    <div className="text-slate-50 flex justify-center items-center">
    <CardWrapper
    headerLabel="Enter a New Password"
    backButtonLabel="Back to Login ?"
    backButtonHref="/auth/login"
    >
    <Form {...form}>
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <div className="space-y-4">
    <FormField
    control={form.control}
    name="password"
    render={({ field }) => (
      <FormItem>
      <FormLabel>Password</FormLabel>
      <FormControl>
      <Input
      disabled={isPending}
      {...field}
      placeholder="*********"
      type="password"
      />
      </FormControl>
      <FormMessage className="text-xm text-orange-400 font-light" />
      </FormItem>
    )}
    />
    </div>
    <FormError message={error} />
    <FormSuccess message={success} />
    <Button
    variant="default"
    type="submit"
    className="w-full"
    disabled={isPending}
    >
    Reset Password
    </Button>
    </form>
    </Form>
    </CardWrapper>
    </div>
  );
};

export default NewPasswordForm;
