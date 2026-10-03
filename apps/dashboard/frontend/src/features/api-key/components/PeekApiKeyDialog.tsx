import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { KeyRound, X, AlertCircle } from "lucide-react";
import type {
  ApiKeyEnvironment,
  GeneratedApiKeyData,
  OldKeyRevokeStrategy,
} from "../api/api-key.types";
import { useGetActiveApiKey } from "../hooks/useGetActiveApiKey";
import { useGenerateApiKey } from "../hooks/useGenerateApiKey";
import { useRotateApiKey } from "../hooks/useRotateApiKey";
import NoActiveApiKeyComp from "./NoActiveApiKeyComp";
import ActiveApiKeyDetailsComp from "./ActiveApiKeyDetailsComp";
import GeneratedApiKeyComp from "./GeneratedApiKeyComp";
import UnsavedKeyWarningDialog from "./UnsavedKeyWarningDialog";
import ApiKeyRotateStrategyDialog from "./ApiKeyRotateStrategyDialog";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import { Button } from "@/components/buttons/CustomButton";

export interface PeekApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PeekApiKeyDialog: React.FC<PeekApiKeyDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [environment, setEnvironment] = useState<ApiKeyEnvironment>("TEST");
  const [newlyGeneratedKey, setNewlyGeneratedKey] =
    useState<GeneratedApiKeyData | null>(null);
  const [hasCopiedKeyId, setHasCopiedKeyId] = useState(false);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  // Rotation strategy modal state
  const [isRotateStrategyOpen, setIsRotateStrategyOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] =
    useState<OldKeyRevokeStrategy>("24_HOURS");

  // Tanstack Query hooks
  const {
    data: activeKey,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetActiveApiKey(environment);

  const generateMutation = useGenerateApiKey();
  const rotateMutation = useRotateApiKey();

  // Reset transient generated key when environment changes
  useEffect(() => {
    setNewlyGeneratedKey(null);
    setHasCopiedKeyId(false);
    setHasCopiedSecret(false);
  }, [environment]);

  // Attempt to close the dialog
  const handleAttemptClose = () => {
    if (newlyGeneratedKey) {
      const isSaved = hasCopiedKeyId && hasCopiedSecret;
      if (!isSaved) {
        setShowUnsavedWarning(true);
        return;
      }
    }
    finalizeClose();
  };

  const finalizeClose = () => {
    setNewlyGeneratedKey(null);
    setHasCopiedKeyId(false);
    setHasCopiedSecret(false);
    setShowUnsavedWarning(false);
    onClose();
  };

  const handleDoneSaving = () => {
    if (!hasCopiedKeyId || !hasCopiedSecret) {
      setShowUnsavedWarning(true);
      return;
    }
    setNewlyGeneratedKey(null);
    setHasCopiedKeyId(false);
    setHasCopiedSecret(false);
    refetch();
  };

  const handleGenerate = () => {
    generateMutation.mutate(
      { environment },
      {
        onSuccess: (data) => {
          setNewlyGeneratedKey(data);
          setHasCopiedKeyId(false);
          setHasCopiedSecret(false);
        },
      },
    );
  };

  const handleConfirmRotate = () => {
    rotateMutation.mutate(
      { environment, oldKeyRevokeStrategy: selectedStrategy },
      {
        onSuccess: (data) => {
          setIsRotateStrategyOpen(false);
          setNewlyGeneratedKey(data);
          setHasCopiedKeyId(false);
          setHasCopiedSecret(false);
        },
      },
    );
  };

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isRotateStrategyOpen || showUnsavedWarning) return;
        handleAttemptClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    isOpen,
    newlyGeneratedKey,
    hasCopiedKeyId,
    hasCopiedSecret,
    isRotateStrategyOpen,
    showUnsavedWarning,
  ]);

  if (!isOpen) return null;

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
          aria-labelledby="peek-api-key-dialog-title"
          className={[
            "relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto",
            "bg-card text-card-foreground border border-border",
            "rounded-[calc(var(--radius)+4px)] shadow-2xl p-6 sm:p-7",
            "flex flex-col gap-6",
          ].join(" ")}
        >
          {/* ── Dialog Header ── */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h2
                  id="peek-api-key-dialog-title"
                  className="text-lg font-bold text-foreground"
                >
                  {newlyGeneratedKey
                    ? "New API Key Credentials"
                    : "Merchant API Key"}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {newlyGeneratedKey
                    ? "Store your newly generated credentials safely."
                    : "Inspect active credentials for integration."}
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

          {/* ── Environment Selector Tabs (hidden when displaying newly generated key) ── */}
          {!newlyGeneratedKey && (
            <div className="flex items-center p-1 bg-muted/40 rounded-(--radius) border border-input self-start">
              <button
                type="button"
                onClick={() => setEnvironment("TEST")}
                className={[
                  "px-3 py-1 text-xs font-semibold rounded-(--radius-sm) transition-all cursor-pointer",
                  environment === "TEST"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                TEST Environment
              </button>
              <button
                type="button"
                onClick={() => setEnvironment("LIVE")}
                className={[
                  "px-3 py-1 text-xs font-semibold rounded-(--radius-sm) transition-all cursor-pointer",
                  environment === "LIVE"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                LIVE Environment
              </button>
            </div>
          )}

          {/* ── Dynamic Content Body ── */}
          {newlyGeneratedKey ? (
            <GeneratedApiKeyComp
              generatedKey={newlyGeneratedKey}
              hasCopiedKeyId={hasCopiedKeyId}
              hasCopiedSecret={hasCopiedSecret}
              onCopiedKeyId={() => setHasCopiedKeyId(true)}
              onCopiedSecret={() => setHasCopiedSecret(true)}
              onDone={handleDoneSaving}
            />
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <CircularLoadingBar size={36} strokeWidth={3.5} />
              <p className="text-xs text-muted-foreground">
                Fetching active {environment} API key...
              </p>
            </div>
          ) : isError ? (
            <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-(--radius) flex flex-col items-center justify-center text-center gap-3">
              <AlertCircle className="w-6 h-6 text-destructive" />
              <p className="text-xs text-muted-foreground max-w-xs">
                {error instanceof Error
                  ? error.message
                  : "Failed to retrieve active API key."}
              </p>
              <Button
                text="Try Again"
                color="secondary"
                onClick={() => refetch()}
                className="text-xs h-8 px-4"
              />
            </div>
          ) : activeKey ? (
            <ActiveApiKeyDetailsComp
              apiKey={activeKey}
              onRotate={() => setIsRotateStrategyOpen(true)}
            />
          ) : (
            <NoActiveApiKeyComp
              environment={environment}
              onGenerate={handleGenerate}
              isGenerating={generateMutation.isPending}
            />
          )}
        </div>
      </div>

      {/* ── Rotate API Key Strategy Modal ── */}
      <ApiKeyRotateStrategyDialog
        isOpen={isRotateStrategyOpen}
        onClose={() => setIsRotateStrategyOpen(false)}
        selectedStrategy={selectedStrategy}
        onSelectStrategy={setSelectedStrategy}
        onConfirm={handleConfirmRotate}
        isLoading={rotateMutation.isPending}
      />

      {/* ── Unsaved Secret Key Warning Dialog ── */}
      <UnsavedKeyWarningDialog
        isOpen={showUnsavedWarning}
        onClose={() => setShowUnsavedWarning(false)}
        onConfirmCloseAnyway={finalizeClose}
      />
    </>,
    document.body,
  );
};

export default PeekApiKeyDialog;
