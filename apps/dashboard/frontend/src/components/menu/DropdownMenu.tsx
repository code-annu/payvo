import type React from "react";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export interface DropdownMenuProps {
  /** Whether the dropdown is visible */
  isOpen: boolean;
  /** Close callback (backdrop click, Escape, close button) */
  onClose: () => void;
  /** Title displayed in the header */
  title: string;
  /** Accessible label for the dropdown panel */
  ariaLabel?: string;
  /** Optional footer content (e.g. action buttons) */
  footer?: React.ReactNode;
  /** Scrollable body content */
  children: React.ReactNode;
}

/**
 * Generic dropdown menu panel.
 * Anchored top-right with a backdrop overlay.
 * Provides header (title + close), scrollable body, and optional footer slots.
 *
 * Styled with the PayO design-system tokens.
 */
export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  isOpen,
  onClose,
  title,
  ariaLabel,
  footer,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus panel on open
  useEffect(() => {
    if (isOpen && panelRef.current) {
      panelRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      role="presentation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — anchored top-right */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel ?? title}
        tabIndex={-1}
        className={[
          "relative z-10 mt-16 mr-4 w-full max-w-sm",
          "bg-popover text-popover-foreground",
          "border border-border rounded-[calc(var(--radius)+4px)]",
          "shadow-lg overflow-hidden",
          "focus:outline-none",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={[
              "inline-flex items-center justify-center w-7 h-7 rounded-(--radius)",
              "text-muted-foreground hover:text-foreground hover:bg-muted",
              "transition-colors duration-150 cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            ].join(" ")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="max-h-72 overflow-y-auto p-2">{children}</div>

        {/* Optional footer */}
        {footer && (
          <div className="border-t border-border px-4 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
};

export default DropdownMenu;
