import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User as UserIcon,
  Building2,
  Mail,
  ShieldCheck,
  Calendar,
  Copy,
  Check,
} from "lucide-react";
import type { User } from "../api/user.types";
import {
  updateUserSchema,
  type UpdateUserFormData,
} from "../schema/UpdateUserSchema";
import { useUpdateUser } from "../hooks/useUpdateUser";
import { TextInput } from "@/components/inputs/TextInputField";
import { Button } from "@/components/buttons/CustomButton";
import OutlinedButton from "@/components/buttons/OutlinedButton";

export interface AccountDetailsSectionProps {
  user: User;
}

export const AccountDetailsSection: React.FC<AccountDetailsSectionProps> = ({
  user,
}) => {
  const updateUser = useUpdateUser();
  const [copiedId, setCopiedId] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      fullname: user.fullname ?? "",
      companyName: user.companyName ?? "",
    },
  });

  // Re-sync form state when user query updates
  useEffect(() => {
    reset({
      fullname: user.fullname ?? "",
      companyName: user.companyName ?? "",
    });
  }, [user, reset]);

  const onSubmit = (data: UpdateUserFormData) => {
    updateUser.mutate({
      fullname: data.fullname,
      companyName: data.companyName ? data.companyName.trim() : null,
    });
  };

  const handleDiscard = () => {
    reset({
      fullname: user.fullname ?? "",
      companyName: user.companyName ?? "",
    });
  };

  const handleCopyId = async () => {
    if (!user.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      // Fallback ignore
    }
  };

  // Format initials
  const initials = user.fullname
    ? user.fullname
        .split(" ")
        .map((n) => n[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  // Format joined date
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] shadow-xs overflow-hidden">
      {/* Profile Banner / Header */}
      <div className="p-6 sm:p-8 border-b border-border bg-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-xl shadow-xs select-none">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {user.fullname || "User Profile"}
                </h2>
                {user.isEmailVerified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning border border-warning/20">
                    Unverified
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>

          {memberSince && (
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-(--radius) border border-border/50 self-start sm:self-center">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Joined {memberSince}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Details Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="p-6 sm:p-8 flex flex-col gap-6"
      >
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Personal Information
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Update your public name and organizational details.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <TextInput
            label="Full Name"
            placeholder="e.g. Jane Doe"
            required
            autoComplete="name"
            startAdornment={<UserIcon className="w-4 h-4" />}
            error={!!errors.fullname}
            helperText={errors.fullname?.message}
            {...register("fullname")}
          />

          <TextInput
            label="Company Name"
            placeholder="e.g. Acme Corp (optional)"
            autoComplete="organization"
            startAdornment={<Building2 className="w-4 h-4" />}
            error={!!errors.companyName}
            helperText={
              errors.companyName?.message ||
              "Your registered company or organization."
            }
            {...register("companyName")}
          />

          <TextInput
            label="Email Address"
            value={user.email}
            isDisabled
            startAdornment={<Mail className="w-4 h-4" />}
            helperText="Email is linked to your primary account and cannot be modified."
          />

          <div>
            <label className="text-xs font-semibold tracking-wide flex items-center gap-1 select-none text-foreground mb-1.5">
              Account ID
            </label>
            <div className="relative flex items-center w-full rounded-(--radius) border border-input bg-muted/30 px-3.5 h-10 transition-all duration-200">
              <span className="font-mono text-xs text-muted-foreground truncate select-all flex-1">
                {user.id}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                title="Copy Account ID"
                className="ml-2 p-1.5 rounded-(--radius) text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Unique identifier for your account in PayO API requests.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <OutlinedButton
            text="Discard"
            onClick={handleDiscard}
            isDisabled={!isDirty || updateUser.isPending}
          />
          <Button
            type="submit"
            text="Save Changes"
            isLoading={updateUser.isPending}
            isDisabled={!isDirty || updateUser.isPending}
            color="primary"
          />
        </div>
      </form>
    </div>
  );
};

export default AccountDetailsSection;
