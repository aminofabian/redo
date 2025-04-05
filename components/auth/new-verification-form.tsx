"use client"

import CardWrapper from "./CardWrapper"
import { BeatLoader, ClimbingBoxLoader } from 'react-spinners';
import {  useSearchParams
} from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getToken } from "next-auth/jwt";
import { newVerification } from "@/actions/new-verification";
import FormError from "../common/FormError";
import FormSuccess from "../common/FormSuccess";

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined >();
  
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const onSubmit = useCallback(() => {
    if (success || error) return;
    
    if (!token) {
      setError("Missing token");
      return;
    }
    newVerification(token)
    .then((data) => {
      setSuccess(data.success);
      setError(data.error);
      
    })
    .catch(() => {
      setError("something Went Wrong")
    })
  }, [token, success, error])
  
  useEffect(() => {
    onSubmit();
    
  }, [onSubmit])
  
  return (
    <CardWrapper
    headerLabel="Confirming Your Verification"
    backButtonLabel="Back to Login"
    backButtonHref="/auth/login"
    >
    <div className="flex items-center w-full justify-center">
    
    {!success && !error && (
      <BeatLoader />
      
    )
  }
  <FormSuccess message={success} />
  
  {!success && (
    <FormError message={error} />)}
    
    
    </div>
    </CardWrapper>   
    
    
  )  
  
}