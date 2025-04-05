import * as z from "zod";
import React from "react";

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum of 6 characters for the password",
  })
});


export const ResetSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  })
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(1, {
    message: "Please enter a valid password",
  }),
});

export const RegisterSchema = z.object({
  firstName: z.string().min(4, {
    message: "first name is required",
  }),
  lastName: z.string().min(4, {
    message: "last name is required",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  password: z.string().min(6, {
    message: "Please enter a valid password. Minimum length is 6 characters",
  }),
});
