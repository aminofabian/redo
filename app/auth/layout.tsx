import LoginSide from "@/components/auth/LoginSide";
import React from "react";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="container grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-8 my-10 justify-center text-center">
    {/* <div className="h-32 rounded-lg bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 to-blue-800 text-center">
    <LoginSide />
  </div> */}
  <div className="h-screen rounded-lg bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-400 to-blue-800 text-center order-first lg:order-last p-5 mx-auto">
  {children}
  </div>
  </div>
);
};

export default AuthLayout;
