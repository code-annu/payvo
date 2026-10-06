import React, { useState } from "react";
import { LogOut } from "lucide-react";
import { useLogout } from "../hooks/useLogout";
import ConfirmDialog from "@/components/dialog/ConfirmDialog";
import { Button, type ButtonColor } from "@/components/buttons/CustomButton";
import { OutlinedButton } from "@/components/buttons/OutlinedButton";

export type LogoutButtonVariant = "sidebar" | "button" | "outline" | "icon";

export interface LogoutButtonProps {
  /** Visual style variant. Defaults to 'sidebar' */
  variant?: LogoutButtonVariant;
  /** Custom label text. Defaults to 'Log out' */
  text?: string;
  /** Semantic color for the button variant. Defaults to 'destructive' */
  color?: ButtonColor;
  /** Whether to render the LogOut icon. Defaults to true */
  showIcon?: boolean;
  /** Additional container / button CSS class names */
  className?: string;
}

export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = "sidebar",
  text = "Log out",
  color = "destructive",
  showIcon = true,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const logoutMutation = useLogout();

  const handleOpenConfirm = () => {
    setIsOpen(true);
  };

  const handleCloseConfirm = () => {
    if (!logoutMutation.isPending) {
      setIsOpen(false);
    }
  };

  const handleConfirmLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        setIsOpen(false);
      },
    });
  };

  return (
    <>
      {/* ── Trigger Button by Variant ── */}
      {variant === "sidebar" && (
        <button
          type="button"
          onClick={handleOpenConfirm}
          className={[
            "group flex items-center gap-3 w-full px-3 py-2.5 rounded-(--radius)",
            "text-sm font-medium transition-all duration-200 ease-in-out select-none cursor-pointer text-left",
            "text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2",
            className,
          ].join(" ")}
          aria-label={text}
        >
          {showIcon && (
            <span className="shrink-0 w-5 h-5 flex items-center justify-center transition-colors duration-200 text-sidebar-foreground/70 group-hover:text-destructive">
              <LogOut className="w-5 h-5" />
            </span>
          )}
          <span className="truncate">{text}</span>
        </button>
      )}

      {variant === "button" && (
        <Button
          text={text}
          color={color}
          onClick={handleOpenConfirm}
          className={className}
        >
          {showIcon && <LogOut className="w-4 h-4 mr-1.5" />}
        </Button>
      )}

      {variant === "outline" && (
        <OutlinedButton
          text={text}
          onClick={handleOpenConfirm}
          className={className}
        >
          {showIcon && <LogOut className="w-4 h-4 mr-1.5 text-destructive" />}
        </OutlinedButton>
      )}

      {variant === "icon" && (
        <button
          type="button"
          onClick={handleOpenConfirm}
          title={text}
          aria-label={text}
          className={[
            "inline-flex items-center justify-center w-9 h-9 rounded-(--radius)",
            "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            "transition-colors duration-150 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive",
            className,
          ].join(" ")}
        >
          <LogOut className="w-4 h-4" />
        </button>
      )}

      {/* ── Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleCloseConfirm}
        title="Log Out"
        description="Are you sure you want to log out of your Payvo merchant account? You will need to sign in again to access your dashboard."
        variant="destructive"
        icon={<LogOut className="w-5 h-5 text-destructive" />}
        disableEscapeKeyDown={logoutMutation.isPending}
        disableBackdropClick={logoutMutation.isPending}
        cancelButton={
          <OutlinedButton
            text="Cancel"
            onClick={handleCloseConfirm}
            isDisabled={logoutMutation.isPending}
            className="text-xs h-9 px-4"
          />
        }
        confirmButton={
          <Button
            text="Yes, Log Out"
            color="destructive"
            isLoading={logoutMutation.isPending}
            onClick={handleConfirmLogout}
            className="text-xs h-9 px-4"
          />
        }
      />
    </>
  );
};

export default LogoutButton;
