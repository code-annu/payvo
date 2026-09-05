import React, { useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, X, Calendar } from "lucide-react";
import type { ApiKey, OldKeyRevokeStrategy } from "../api/api-key.types";
import { useRotateApiKey } from "../hooks/useRotateApiKey";
import { ApiKeyStrategyDialog } from "./ApiKeyStrategyDialog";
import { Button } from "@/components/buttons/CustomButton";
import OutlinedButton from "@/components/buttons/OutlinedButton";
import { CopyableField } from "@/components/inputs/CopyableField";

export interface ApiKeyRegenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: ApiKey | null;
  merchantId: string;
  onRegenerateSuccess: (newApiKey: ApiKey) => void;
}

export const ApiKeyRegenerateDialog: React.FC<ApiKeyRegenerateDialogProps> = ({
  isOpen,
  onClose,
  apiKey,
  merchantId,
  onRegenerateSuccess,
}) => {
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [strategy, setStrategy] = useState<OldKeyRevokeStrategy>("24_HOURS");

  const rotateApiKey = useRotateApiKey();

  if (!isOpen || !apiKey) return null;

  const maskKeyId = (id: string) => {
    if (!id || id.length <= 12) return id || "••••••••";
    const prefix = id.slice(0, 8);
    const suffix = id.slice(-4);
    return `${prefix}••••••••${suffix}`;
  };

  const handleExecuteRotate = () => {
    rotateApiKey.mutate(
      {
        merchantId,
        environment: apiKey.environment,
        oldKeyRevokeStrategy: strategy,
      },
      {
        onSuccess: (newKey) => {
          setShowStrategyDialog(false);
          onClose();
          onRegenerateSuccess(newKey);
        },
      },
    );
  };

  const formattedDate = apiKey.generatedOn
    ? new Date(apiKey.generatedOn).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-in fade-in duration-200"
        role="presentation"
      >
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

        {/* Dialog Panel */}
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-key-details-title"
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
                    id="api-key-details-title"
                    className="text-lg font-bold text-foreground"
                  >
                    API Key Details
                  </h3>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                    {apiKey.environment}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use this key to authenticate requests from your backend.
                </p>
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

          {/* Key Fields */}
          <div className="flex flex-col gap-4">
            {/* Key ID with CopyableField */}
            <CopyableField
              label="Key ID"
              value={apiKey.keyId}
              displayValue={maskKeyId(apiKey.keyId)}
              copySuccessMessage="Key ID copied to clipboard!"
              copyTooltip="Copy full Key ID"
            />

            {/* Secret Key (Encrypted / Write-only) */}
            <CopyableField
              label="Secret Key"
              value=""
              isSecret={true}
              helperText="For security reasons, the secret is only visible immediately after creation. If lost, you can rotate the key."
              copyTooltip="Secret key is encrypted and hidden"
            />

            {/* Generated Date Metadata */}
            {formattedDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-(--radius) border border-border/50">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Created on {formattedDate}</span>
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-3">
            <OutlinedButton text="Close" onClick={onClose} />
            <Button
              text="Regenerate Key"
              color="primary"
              onClick={() => setShowStrategyDialog(true)}
              className="gap-1.5"
            />
          </div>
        </div>
      </div>

      {/* Deactivation Strategy Selection Dialog */}
      <ApiKeyStrategyDialog
        isOpen={showStrategyDialog}
        onClose={() => setShowStrategyDialog(false)}
        selectedStrategy={strategy}
        onSelectStrategy={setStrategy}
        onConfirm={handleExecuteRotate}
        isLoading={rotateApiKey.isPending}
      />
    </>,
    document.body,
  );
};

export default ApiKeyRegenerateDialog;
