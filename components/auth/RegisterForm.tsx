"use client";

import * as z from "zod";

import CardWrapper from "./CardWrapper";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterSchema } from "@/schemas";
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
import FormError from "../common/FormError";
import FormSuccess from "../common/FormSuccess";
import { register } from "@/actions/register";
import { useState, useTransition } from "react";

const RegisterForm = () => {
  const [isPending, startTransistion] = useTransition();

  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSuccess("");
    startTransistion(() => {
      register(values).then((data) => {
        setError(data.error);
        setSuccess(data.success);
      });
    });
  };
  return (
    <div className="w-full">
      <CardWrapper
        headerLabel="Create an Account"
        backButtonLabel="Already Have an Account?"
        backButtonHref="/auth/login"
        showSocial
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[13px] font-medium text-gray-700">
                        First Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={isPending}
                          {...field}
                          placeholder="John"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-[13px] font-medium text-gray-700">
                        Last Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          disabled={isPending}
                          {...field}
                          placeholder="Doe"
                          className="h-11 bg-white border border-gray-300 rounded-[4px] px-3 
                                   focus:ring-2 focus:ring-offset-1 focus:ring-green-700 focus:border-green-700
                                   placeholder:text-gray-500 text-gray-900"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-500 font-normal mt-1" />
                    </FormItem>
                  )}
                />
              </div>
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
                        disabled={isPending}
                        {...field}
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
                    <FormLabel className="text-[13px] font-medium text-gray-700">
                      Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="••••••••"
                          type="password"
                          disabled={isPending}
                          className="h-11 bg-white border border-gray-300 rounded-[4px] px-3 
                                   focus:ring-2 focus:ring-offset-1 focus:ring-green-700 focus:border-green-700
                                   placeholder:text-gray-500 text-gray-900"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-red-500 font-normal mt-1" />
                  </FormItem>
                )}
              />
            </div>
            <FormError message={error} />
            <FormSuccess message={success} />
            <Button
              variant="default"
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
                  <span>Processing...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </Form>
      </CardWrapper>
    </div>
  );
};

export default RegisterForm;
