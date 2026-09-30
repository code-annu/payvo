import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import AppRoutes from "@/router/app.routes";
import { signupSchema, type SignupFormData } from "../schema/SignupSchema";
import type { SignupRequest } from "../api/auth.types";
import { TextInput } from "@/components/inputs/TextInputField";
import { PasswordInput } from "@/components/inputs/PasswordInputField";
import { Button } from "@/components/buttons/CustomButton";
import { useSignup } from "../hooks/useSignup";

export const SignupPage: React.FC = () => {
  const signup = useSignup();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullname: "",
      email: "",
      companyName: "",
      password: "",
    },
  });

  const onSubmit = (data: SignupFormData) => {
    const signupRequest: SignupRequest = {
      fullname: data.fullname,
      email: data.email,
      password: data.password,
      companyName: data.companyName,
    };

    signup.mutate(signupRequest);

    console.log("Signup submitted (SignupRequest):", signupRequest);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Auth Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-[calc(var(--radius)+4px)] p-6 sm:p-8 shadow-sm transition-all duration-200">
        {/* Brand & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-(--radius) bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm shadow-primary/25">
              P
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Pay<span className="text-primary">O</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Sign up to get started.
          </p>
        </div>

        {/* Signup Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
          <TextInput
            label="Full Name"
            placeholder="Enter your full name"
            autoComplete="name"
            required
            error={!!errors.fullname}
            helperText={errors.fullname?.message}
            {...register("fullname")}
          />

          <TextInput
            label="Email"
            placeholder="Enter your email"
            type="email"
            autoComplete="email"
            required
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register("email")}
          />

          <TextInput
            label="Company Name"
            placeholder="Enter your company name (optional)"
            autoComplete="organization"
            error={!!errors.companyName}
            helperText={errors.companyName?.message}
            {...register("companyName")}
          />

          <PasswordInput
            label="Password"
            placeholder="Create a password (min. 8 characters)"
            autoComplete="new-password"
            required
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register("password")}
          />

          <Button
            text="Create Account"
            type="submit"
            isLoading={signup.isPending}
            className="w-full mt-2"
          />
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to={AppRoutes.LOGIN}
            className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
