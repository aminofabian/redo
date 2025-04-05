"use client";

import * as z from "zod";

import CardWrapper from "./CardWrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetSchema } from "@/schemas";
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
import { reset } from "@/actions/reset";
import FormError from "../common/FormError";

const ResetForm = () => {
  
  const [isPending, startTransition] = useTransition();
  
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  
  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSuccess("");
    startTransition(() => {
      reset(values)
      .then((data) => {
        setError(data?.error);
        setSuccess(data?.success);
      });
    }); 
  };
  return (
    <div className="text-slate-50 flex justify-center items-center">
    <CardWrapper
    headerLabel="Forgot Your Password?"
    backButtonLabel="Back to Login ?"
    backButtonHref="/auth/login"
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
    </div>
    <FormError message={error} />
    <FormSuccess message={success} />
    <Button
    variant="default"
    type="submit"
    className="w-full"
    disabled={isPending}
    >
    Send Reset Email
    </Button>
    </form>
    </Form>
    </CardWrapper>
    </div>
  );
};

export default ResetForm;
