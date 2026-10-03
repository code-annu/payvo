import type React from "react";
import {
  KeyRound,
  CheckCircle2,
  Clock,
  Calendar,
  ShieldAlert,
  RefreshCw,
} from "lucide-react";
import type { ActiveApiKeyData } from "../api/api-key.types";
import CopyableField from "@/components/inputs/CopyableField";
import { Button } from "@/components/buttons/CustomButton";
import DateTimeUtil from "@/core/util/date-time.util";

export interface ActiveApiKeyDetailsCompProps {
  apiKey: ActiveApiKeyData;
  onRotate?: () => void;
}

export const ActiveApiKeyDetailsComp: React.FC<ActiveApiKeyDetailsCompProps> = ({
  apiKey,
  onRotate,
}) => {
  const handleRotate = () => {
    console.log(
      "[ActiveApiKeyDetailsComp] Rotate API key clicked for key:",
      apiKey.id,
      apiKey.keyId,
    );
    onRotate?.();
  };

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6 bg-card border border-border rounded-[calc(var(--radius)+4px)] shadow-xs">
      {/* ── Top Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-(--radius) bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">
                Active API Key
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                {apiKey.environment}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Currently active and ready for authentication
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Active
        </span>
      </div>

      {/* ── Key ID Display ── */}
      <CopyableField
        label="Key ID"
        value={apiKey.keyId}
        copySuccessMessage="Key ID copied to clipboard!"
        copyTooltip="Copy full Key ID"
        helperText="Include this ID in your API request headers or SDK configuration."
      />

      {/* ── Security Note ── */}
      <div className="p-3 bg-muted/40 border border-border/80 rounded-(--radius) flex items-start gap-2.5 text-xs text-muted-foreground leading-relaxed">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          For security reasons, your Key Secret is stored as an irreversible
          Argon2 hash and cannot be recovered. If your key secret is compromised,
          rotate it immediately.
        </span>
      </div>

      {/* ── Timestamps Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 shrink-0 text-primary" />
          <span>
            Created at:{" "}
            <strong className="text-foreground font-medium">
              {apiKey.generatedAt
                ? DateTimeUtil.formatDate(apiKey.generatedAt)
                : "Unknown"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-3.5 h-3.5 shrink-0 text-primary" />
          <span>
            Last used:{" "}
            <strong className="text-foreground font-medium">
              {apiKey.lastUsedAt
                ? DateTimeUtil.formatDate(apiKey.lastUsedAt)
                : "Never used"}
            </strong>
          </span>
        </div>
      </div>

      {/* ── Action Footer: Rotate Button (console.log only) ── */}
      <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          Need a new secret key?
        </span>
        <Button
          text="Rotate API Key"
          color="secondary"
          onClick={handleRotate}
          className="text-xs h-9 px-4 gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default ActiveApiKeyDetailsComp;
