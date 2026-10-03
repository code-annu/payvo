import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  KeyRound,
  ShieldAlert,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  X,
} from "lucide-react";
import type {
  MerchantApiKey,
  ApiKeyStatus,
  GeneratedApiKeyData,
  OldKeyRevokeStrategy,
} from "../api/api-key.types";
import { useRevokeApiKey } from "../hooks/useRevokeApiKey";
import { useRotateApiKey } from "../hooks/useRotateApiKey";
import { Button } from "@/components/buttons/CustomButton";
import { OutlinedButton } from "@/components/buttons/OutlinedButton";
import ConfirmDialog from "@/components/dialog/ConfirmDialog";
import CopyableField from "@/components/inputs/CopyableField";
import DateTimeUtil from "@/core/util/date-time.util";
import ApiKeyRotateStrategyDialog from "./ApiKeyRotateStrategyDialog";
import GeneratedApiKeyComp from "./GeneratedApiKeyComp";
import UnsavedKeyWarningDialog from "./UnsavedKeyWarningDialog";

export interface ApiKeyCompProps {
  apiKey: MerchantApiKey;
}

function getStatusBadge(status: ApiKeyStatus) {
  switch (status) {
    case "ACTIVE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success border border-success/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Active
        </span>
      );
    case "GRACE_PERIOD":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning/15 text-warning border border-warning/30">
          <AlertTriangle className="w-3.5 h-3.5" />
          Grace Period
        </span>
      );
    case "REVOKED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/15 text-destructive border border-destructive/30">
          <XCircle className="w-3.5 h-3.5" />
          Revoked
        </span>
      );
  }
}

export const ApiKeyComp: React.FC<ApiKeyCompProps> = ({ apiKey }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isRotateStrategyOpen, setIsRotateStrategyOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] =
    useState<OldKeyRevokeStrategy>("24_HOURS");
  const [newlyRotatedKey, setNewlyRotatedKey] =
    useState<GeneratedApiKeyData | null>(null);
  const [hasCopiedKeyId, setHasCopiedKeyId] = useState(false);
  const [hasCopiedSecret, setHasCopiedSecret] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);

  const revokeMutation = useRevokeApiKey();
  const rotateMutation = useRotateApiKey();

  const isRevoked = apiKey.status === "REVOKED";
  const isActive = apiKey.status === "ACTIVE";

  const handleConfirmRevoke = () => {
    revokeMutation.mutate(apiKey.id, {
      onSuccess: () => {
        setIsConfirmOpen(false);
      },
    });
  };

  const handleConfirmRotate = () => {
    rotateMutation.mutate(
      {
        environment: apiKey.environment,
        oldKeyRevokeStrategy: selectedStrategy,
      },
      {
        onSuccess: (data) => {
          setIsRotateStrategyOpen(false);
          setNewlyRotatedKey(data);
          setHasCopiedKeyId(false);
          setHasCopiedSecret(false);
        },
      },
    );
  };

  const handleAttemptCloseRotatedKey = () => {
    if (!hasCopiedKeyId || !hasCopiedSecret) {
      setShowUnsavedWarning(true);
      return;
    }
    setNewlyRotatedKey(null);
  };

  const handleConfirmCloseAnyway = () => {
    setShowUnsavedWarning(false);
    setNewlyRotatedKey(null);
  };

  return (
    <>
      <div
        className={[
          "relative bg-card text-card-foreground border border-border rounded-[calc(var(--radius)+4px)] p-5 sm:p-6",
          "transition-all duration-200 shadow-xs hover:border-border/80 flex flex-col gap-5",
          isRevoked ? "opacity-75 bg-muted/15" : "",
        ].join(" ")}
      >
        {/* ── Top Header: Environment & Status Badges + Action ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={[
                "w-9 h-9 rounded-(--radius) flex items-center justify-center shrink-0",
                isRevoked
                  ? "bg-muted text-muted-foreground"
                  : apiKey.environment === "LIVE"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent text-accent-foreground",
              ].join(" ")}
            >
              <KeyRound className="w-4.5 h-4.5" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Environment Tag */}
              <span
                className={[
                  "text-xs font-mono font-semibold px-2 py-0.5 rounded-(--radius-sm) uppercase tracking-wider",
                  apiKey.environment === "LIVE"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground border border-input",
                ].join(" ")}
              >
                {apiKey.environment}
              </span>

              {/* Status Badge */}
              {getStatusBadge(apiKey.status)}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {isActive && (
              <Button
                text="Rotate"
                color="secondary"
                onClick={() => setIsRotateStrategyOpen(true)}
                isDisabled={
                  rotateMutation.isPending || revokeMutation.isPending
                }
                className="text-xs h-8 px-3 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}

            {!isRevoked && (
              <Button
                text="Revoke Now"
                color="destructive"
                onClick={() => setIsConfirmOpen(true)}
                isDisabled={
                  revokeMutation.isPending || rotateMutation.isPending
                }
                className="text-xs h-8 px-3 gap-1.5"
              />
            )}
          </div>
        </div>

        {/* ── API Key UUID Field ── */}
        <CopyableField
          label="Key Identifier (UUID)"
          value={apiKey.id}
          copySuccessMessage="API Key ID copied to clipboard!"
          helperText="Use this ID to reference this key in requests and dashboard configurations."
        />

        {/* ── Details Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
          {/* Last Used */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Last used:{" "}
              <strong className="text-foreground font-medium">
                {apiKey.lastUsedAt
                  ? DateTimeUtil.formatDate(apiKey.lastUsedAt)
                  : "Never used"}
              </strong>
            </span>
          </div>

          {/* Revoked At / Grace Ends At if applicable */}
          {apiKey.revokedAt ? (
            <div className="flex items-center gap-2 text-destructive">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>
                Revoked at:{" "}
                <strong className="font-medium">
                  {DateTimeUtil.formatDate(apiKey.revokedAt)}
                </strong>
              </span>
            </div>
          ) : apiKey.graceEndsAt ? (
            <div className="flex items-center gap-2 text-warning">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>
                Grace ends at:{" "}
                <strong className="font-medium">
                  {DateTimeUtil.formatDate(apiKey.graceEndsAt)}
                </strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>No expiration scheduled</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Revoke Confirmation Dialog ── */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Revoke API Key"
        description="Are you sure you want to revoke this API key? This action is permanent and any server or service integrating with this key will immediately be denied access."
        variant="destructive"
        icon={<ShieldAlert className="w-5 h-5 text-destructive" />}
        disableEscapeKeyDown={revokeMutation.isPending}
        disableBackdropClick={revokeMutation.isPending}
        cancelButton={
          <OutlinedButton
            text="Cancel"
            onClick={() => setIsConfirmOpen(false)}
            isDisabled={revokeMutation.isPending}
            className="text-xs h-9 px-4"
          />
        }
        confirmButton={
          <Button
            text="Yes, Revoke Key"
            color="destructive"
            isLoading={revokeMutation.isPending}
            onClick={handleConfirmRevoke}
            className="text-xs h-9 px-4"
          />
        }
      />

      {/* ── Rotate API Key Strategy Modal ── */}
      <ApiKeyRotateStrategyDialog
        isOpen={isRotateStrategyOpen}
        onClose={() => setIsRotateStrategyOpen(false)}
        selectedStrategy={selectedStrategy}
        onSelectStrategy={setSelectedStrategy}
        onConfirm={handleConfirmRotate}
        isLoading={rotateMutation.isPending}
      />

      {/* ── Newly Rotated Key Display Modal ── */}
      {newlyRotatedKey &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-in fade-in duration-200"
            role="presentation"
          >
            <div
              className="absolute inset-0"
              onClick={handleAttemptCloseRotatedKey}
              aria-hidden="true"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="rotated-key-title"
              className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card text-card-foreground border border-border rounded-[calc(var(--radius)+4px)] shadow-2xl p-6 sm:p-7 flex flex-col gap-6"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h2
                      id="rotated-key-title"
                      className="text-lg font-bold text-foreground"
                    >
                      New API Key Credentials
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Your previous key was rotated. Store your new secret now.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleAttemptCloseRotatedKey}
                  aria-label="Close dialog"
                  className="p-1 rounded-(--radius) text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <GeneratedApiKeyComp
                generatedKey={newlyRotatedKey}
                hasCopiedKeyId={hasCopiedKeyId}
                hasCopiedSecret={hasCopiedSecret}
                onCopiedKeyId={() => setHasCopiedKeyId(true)}
                onCopiedSecret={() => setHasCopiedSecret(true)}
                onDone={handleAttemptCloseRotatedKey}
              />
            </div>
          </div>,
          document.body,
        )}

      {/* ── Unsaved Warning Dialog ── */}
      <UnsavedKeyWarningDialog
        isOpen={showUnsavedWarning}
        onClose={() => setShowUnsavedWarning(false)}
        onConfirmCloseAnyway={handleConfirmCloseAnyway}
      />
    </>
  );
};

export default ApiKeyComp;
