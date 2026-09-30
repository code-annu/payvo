import React, { useState } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export interface CopyableFieldProps {
  /** Label displayed above the field */
  label?: string;
  /** The actual raw value to copy to the clipboard */
  value: string;
  /** Optional custom display text (e.g. masked string). If omitted, displays value */
  displayValue?: string;
  /** Whether the field contains secret/sensitive information */
  isSecret?: boolean;
  /** Whether to show a toggle button to show/hide the secret */
  canToggleVisibility?: boolean;
  /** Helper text displayed below the field */
  helperText?: string;
  /** Message shown in toast upon successful copy */
  copySuccessMessage?: string;
  /** Action title tooltip for copy button */
  copyTooltip?: string;
  /** Callback fired after successful copy */
  onCopy?: (value: string) => void;
  /** Additional container classes */
  className?: string;
}

export const CopyableField: React.FC<CopyableFieldProps> = ({
  label,
  value,
  displayValue,
  isSecret = false,
  canToggleVisibility = false,
  helperText,
  copySuccessMessage = "Copied to clipboard!",
  copyTooltip = "Copy to clipboard",
  onCopy,
  className = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(copySuccessMessage);
      onCopy?.(value);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Determine what text is displayed in the field
  const renderDisplayText = () => {
    if (isSecret && !revealed) {
      return "••••••••••••••••••••••••••••••••";
    }
    return displayValue !== undefined ? displayValue : value;
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Label and optional visibility toggle */}
      {(label || canToggleVisibility) && (
        <div className="flex items-center justify-between">
          {label && (
            <label className="text-xs font-semibold text-foreground select-none">
              {label}
            </label>
          )}
          {canToggleVisibility && isSecret && (
            <button
              type="button"
              onClick={() => setRevealed((prev) => !prev)}
              aria-label={revealed ? "Hide secret" : "Show secret"}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer select-none"
            >
              {revealed ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" /> Hide
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" /> Show
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Field container */}
      <div className="relative flex items-center w-full rounded-(--radius) border border-input bg-muted/30 px-3.5 h-10 transition-all duration-200 focus-within:border-primary/50">
        <span
          className={`font-mono text-xs truncate flex-1 select-none ${
            isSecret && !revealed ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {renderDisplayText()}
        </span>

        <button
          type="button"
          onClick={handleCopy}
          title={copied ? "Copied!" : copyTooltip}
          aria-label={copied ? "Copied!" : copyTooltip}
          className="ml-2 p-1.5 rounded-(--radius) text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
        >
          {copied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Optional helper text */}
      {helperText && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default CopyableField;
