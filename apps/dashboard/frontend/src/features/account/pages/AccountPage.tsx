import type React from "react";
import { AlertCircle } from "lucide-react";
import { useMe } from "../hooks/useMe";
import AccountDetailsSection from "../components/AccountDetailsSection";
import AccountDeleteSection from "../components/AccountDeleteSection";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import { Button } from "@/components/buttons/CustomButton";

export const AccountPage: React.FC = () => {
  const { data: user, isLoading, isError, error, refetch } = useMe();

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 py-2 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal profile, company details, and account preferences.
        </p>
      </div>

      {/* Content states */}
      {isLoading ? (
        <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-12 flex flex-col items-center justify-center gap-3">
          <CircularLoadingBar size={36} strokeWidth={3.5} />
          <p className="text-xs text-muted-foreground">Loading your profile...</p>
        </div>
      ) : isError || !user ? (
        <div className="w-full bg-destructive/5 border border-destructive/20 rounded-[calc(var(--radius)+4px)] p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Failed to load profile
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {error instanceof Error
                ? error.message
                : "Unable to retrieve account details at this time."}
            </p>
          </div>
          <Button
            text="Try Again"
            onClick={() => refetch()}
            color="secondary"
            className="mt-2 text-xs h-9 gap-1.5"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* Personal & Company Details */}
          <AccountDetailsSection user={user} />

          {/* Danger Zone Account Deletion */}
          <AccountDeleteSection />
        </div>
      )}
    </div>
  );
};

export default AccountPage;
