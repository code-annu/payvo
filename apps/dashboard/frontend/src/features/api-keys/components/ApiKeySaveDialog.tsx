import React, { useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, ShieldAlert, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiKey } from "../api/api-key.types";
import { UnsavedKeyWarningDialog } from "./UnsavedKeyWarningDialog";
import { apiKeyQueryKey } from "@/app/query/query.keys";
import { Button } from "@/components/buttons/CustomButton";
import { CopyableField } from "@/components/inputs/CopyableField";

export interface ApiKeySaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: ApiKey | null;
  merchantId: string;
}

export const ApiKeySaveDialog: React.FC<ApiKeySaveDialogProps> = ({
  isOpen,
  onClose,
  apiKey,
  merchantId,
}) => {
  const queryClient = useQueryClient();

  const [hasCopiedKeyId, setHasCopiedKeyId] = useState(false);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  if (!isOpen || !apiKey) return null;

  // Mask middle characters of Key ID
  const maskKeyId = (id: string) => {
    if (!id || id.length <= 12) return id || "••••••••";
    const prefix = id.slice(0, 8);
    const suffix = id.slice(-4);
    return `${prefix}••••••••${suffix}`;
  };

  const finalizeClose = () => {
    // Invalidate query key so the keySecret is removed from query memory
    queryClient.invalidateQueries({
      queryKey: apiKeyQueryKey.active(merchantId, apiKey.environment),
    });
    // Reset internal state
    setHasCopiedKeyId(false);
    setHasCopiedSecret(false);
    setShowWarningDialog(false);
    onClose();
  };

  const handleAttemptClose = () => {
    const isSaved = hasCopiedKeyId && hasCopiedSecret;
    if (!isSaved) {
      setShowWarningDialog(true);
    } else {
      finalizeClose();
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-in fade-in duration-200"
        role="presentation"
      >
        {/* Backdrop click */}
        <div
          className="absolute inset-0"
          onClick={handleAttemptClose}
          aria-hidden="true"
        />

        {/* Dialog Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-api-key-title"
          className={[
            "relative z-10 w-full max-w-lg",
            "bg-card text-card-foreground border border-border",
            "rounded-[calc(var(--radius)+4px)] shadow-2xl p-6 sm:p-7",
            "flex flex-col gap-6",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    id="save-api-key-title"
                    className="text-lg font-bold text-foreground"
                  >
                    Save Your API Keys
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                    {apiKey.environment}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Store your secret key in a secure location.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAttemptClose}
              aria-label="Close dialog"
              className="p-1 rounded-(--radius) text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Critical Notice */}
          <div className="p-3.5 bg-warning/10 border border-warning/30 rounded-(--radius) flex items-start gap-3 text-xs leading-relaxed text-foreground">
            <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning">
                Save your secret key now!
              </p>
              <p className="text-muted-foreground mt-0.5">
                For security reasons, this secret key will{" "}
                <strong className="text-foreground">never</strong> be displayed
                again. If you lose it, you will need to regenerate your keys.
              </p>
            </div>
          </div>

          {/* Key Details Display */}
          <div className="flex flex-col gap-4">
            {/* Key ID with CopyableField */}
            <CopyableField
              label="Key ID"
              value={apiKey.keyId}
              displayValue={maskKeyId(apiKey.keyId)}
              copySuccessMessage="Key ID copied to clipboard!"
              copyTooltip="Copy full Key ID"
              onCopy={() => setHasCopiedKeyId(true)}
            />

            {/* Secret Key with CopyableField */}
            <CopyableField
              label="Secret Key"
              value={apiKey.keySecret ?? ""}
              isSecret={true}
              canToggleVisibility={true}
              copySuccessMessage="Key Secret copied to clipboard!"
              copyTooltip="Copy full Secret Key"
              onCopy={() => setHasCopiedSecret(true)}
            />
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-border flex items-center justify-end gap-3">
            <Button
              text="Done & Close"
              color="primary"
              onClick={handleAttemptClose}
              className="w-full sm:w-auto text-xs h-9 px-6"
            />
          </div>
        </div>
      </div>

      {/* Extracted Safety Confirmation Popup when user hasn't saved */}
      <UnsavedKeyWarningDialog
        isOpen={showWarningDialog}
        onClose={() => setShowWarningDialog(false)}
        onConfirmCloseAnyway={finalizeClose}
      />
    </>,
    document.body,
  );
};

export default ApiKeySaveDialog;
