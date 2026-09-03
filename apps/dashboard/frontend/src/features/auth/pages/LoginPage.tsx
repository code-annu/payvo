import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import AppRoutes from "@/router/app.routes";
import { loginSchema, type LoginFormData } from "../schema/LoginSchema";
import type { LoginRequest } from "../api/types";
import { TextInput } from "@/components/inputs/TextInputField";
import { PasswordInput } from "@/components/inputs/PasswordInputField";
import { Button } from "@/components/buttons/CustomButton";

export const LoginPage: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginRequest) => {
    console.log("Login submitted:", data);
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      {/* Auth Card */}
      <div className="w-full max-w-md bg-card border border-border rounded-[calc(var(--radius)+4px)] p-6 sm:p-8 shadow-sm transition-all duration-200">
        {/* Brand & Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-[var(--radius)] bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl shadow-sm shadow-primary/25">
              P
            </div>
            <span className="text-2xl font-bold tracking-tight text-foreground">
              Pay<span className="text-primary">O</span>
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Sign in to continue to your account.
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="mt-6 flex flex-col gap-4"
        >
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

          <PasswordInput
            label="Password"
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            error={!!errors.password}
            helperText={errors.password?.message}
            {...register("password")}
          />

          <Button
            text="Sign In"
            type="submit"
            isLoading={isSubmitting}
            className="w-full mt-2"
          />
        </form>

        {/* Footer Navigation */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            to={AppRoutes.SIGNUP}
            className="font-medium text-primary hover:underline underline-offset-4 transition-colors"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
