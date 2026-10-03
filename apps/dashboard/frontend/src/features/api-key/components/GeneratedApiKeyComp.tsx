import type React from "react";
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Copy,
  KeyRound,
} from "lucide-react";
import type { GeneratedApiKeyData } from "../api/api-key.types";
import CopyableField from "@/components/inputs/CopyableField";
import { Button } from "@/components/buttons/CustomButton";
import { toast } from "sonner";

export interface GeneratedApiKeyCompProps {
  generatedKey: GeneratedApiKeyData;
  hasCopiedKeyId: boolean;
  hasCopiedSecret: boolean;
  onCopiedKeyId: () => void;
  onCopiedSecret: () => void;
  onDone: () => void;
}

export const GeneratedApiKeyComp: React.FC<GeneratedApiKeyCompProps> = ({
  generatedKey,
  hasCopiedKeyId,
  hasCopiedSecret,
  onCopiedKeyId,
  onCopiedSecret,
  onDone,
}) => {
  const isFullyCopied = hasCopiedKeyId && hasCopiedSecret;

  const handleCopyBoth = async () => {
    try {
      const combined = `KEY_ID=${generatedKey.keyId}\nKEY_SECRET=${generatedKey.keySecret}`;
      await navigator.clipboard.writeText(combined);
      onCopiedKeyId();
      onCopiedSecret();
      toast.success("Both Key ID and Secret Key copied to clipboard!");
    } catch {
      toast.error("Failed to copy credentials");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* ── Header Notice ── */}
      <div className="p-4 bg-warning/10 border border-warning/30 rounded-(--radius) flex items-start gap-3 text-xs leading-relaxed text-foreground">
        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-warning">
            Save your Secret Key now!
          </p>
          <p className="text-muted-foreground">
            For security reasons, your Secret Key will{" "}
            <strong className="text-foreground">never be displayed again</strong>
            . If you lose or navigate away without saving it, you will need to
            rotate your API key.
          </p>
        </div>
      </div>

      {/* ── Key ID Display ── */}
      <CopyableField
        label="Key ID"
        value={generatedKey.keyId}
        copySuccessMessage="Key ID copied to clipboard!"
        copyTooltip="Copy Key ID"
        onCopy={onCopiedKeyId}
        helperText="Public identifier for this API key pair."
      />

      {/* ── Key Secret Display ── */}
      <CopyableField
        label="Secret Key"
        value={generatedKey.keySecret}
        isSecret={true}
        canToggleVisibility={true}
        copySuccessMessage="Secret Key copied to clipboard!"
        copyTooltip="Copy Secret Key"
        onCopy={onCopiedSecret}
        helperText="Private credential. Keep this safe and never commit it to public repos."
      />

      {/* ── Safety Checklist Indicator ── */}
      <div className="p-3 bg-muted/40 border border-border/80 rounded-(--radius) flex flex-col gap-2 text-xs">
        <span className="font-medium text-foreground">
          Required before closing:
        </span>
        <div className="flex items-center gap-4 flex-wrap">
          <div
            className={[
              "flex items-center gap-1.5 transition-colors",
              hasCopiedKeyId ? "text-success font-medium" : "text-muted-foreground",
            ].join(" ")}
          >
            {hasCopiedKeyId ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning" />
            )}
            <span>Key ID copied</span>
          </div>

          <div
            className={[
              "flex items-center gap-1.5 transition-colors",
              hasCopiedSecret ? "text-success font-medium" : "text-muted-foreground",
            ].join(" ")}
          >
            {hasCopiedSecret ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-warning" />
            )}
            <span>Secret Key copied</span>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ── */}
      <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleCopyBoth}
          className="text-xs text-primary hover:underline inline-flex items-center gap-1.5 cursor-pointer py-1 select-none"
        >
          <Copy className="w-3.5 h-3.5" />
          Copy both credentials (.env format)
        </button>

        <Button
          text={isFullyCopied ? "Done & Saved" : "I've Saved My Keys"}
          color={isFullyCopied ? "primary" : "secondary"}
          onClick={onDone}
          className="w-full sm:w-auto text-xs h-9 px-6"
        >
          <KeyRound className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default GeneratedApiKeyComp;
