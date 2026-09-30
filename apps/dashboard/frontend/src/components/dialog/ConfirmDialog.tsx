import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export type ConfirmDialogVariant = "default" | "destructive";

export interface ConfirmDialogProps {
  /** Controls dialog open/visible state */
  isOpen: boolean;
  /** Callback triggered when dialog is closed or cancelled */
  onClose: () => void;
  /** Dialog title */
  title: string;
  /** Optional subtitle or description text below title */
  description?: string;
  /** Optional icon displayed next to the title */
  icon?: React.ReactNode;
  /** The actual content/body of the dialog */
  content?: React.ReactNode;
  /** Alternative children content slot */
  children?: React.ReactNode;
  /** Cancel button component */
  cancelButton?: React.ReactNode;
  /** Confirm button component */
  confirmButton?: React.ReactNode;
  /** Visual variant of dialog. Defaults to 'default' */
  variant?: ConfirmDialogVariant;
  /** Optional custom class name for the dialog container */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** Whether pressing Escape is disabled */
  disableEscapeKeyDown?: boolean;
  /** Whether clicking the backdrop is disabled */
  disableBackdropClick?: boolean;
}

/**
 * Reusable, accessible ConfirmDialog component styled with PayO theme tokens.
 * Provides header, customizable content area, and action button slots.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  icon,
  content,
  children,
  cancelButton,
  confirmButton,
  variant = "default",
  className = "",
  ariaLabel,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
}) => {
  // Handle Escape key press
  useEffect(() => {
    if (!isOpen || disableEscapeKeyDown) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, disableEscapeKeyDown, onClose]);

  if (!isOpen) return null;

  const isDestructive = variant === "destructive";
  const dialogContent = content ?? children;

  const handleBackdropClick = () => {
    if (!disableBackdropClick) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
    >
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog Card Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        className={[
          "relative z-10 w-full max-w-md",
          "bg-card text-card-foreground",
          isDestructive ? "border border-destructive/40" : "border border-border",
          "rounded-[calc(var(--radius)+4px)] shadow-2xl p-6",
          "flex flex-col gap-5",
          className,
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={[
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isDestructive
                    ? "bg-destructive/10 text-destructive"
                    : "bg-primary/10 text-primary",
                ].join(" ")}
              >
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-(--radius) text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {dialogContent && (
          <div className="text-sm text-foreground">{dialogContent}</div>
        )}

        {/* Actions Footer */}
        {(cancelButton || confirmButton) && (
          <div className="flex items-center justify-end gap-3 pt-2">
            {cancelButton}
            {confirmButton}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default ConfirmDialog;
