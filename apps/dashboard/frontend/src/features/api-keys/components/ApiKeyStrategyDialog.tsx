import React from "react";
import { RefreshCw, AlertTriangle, Clock, Zap } from "lucide-react";
import type { OldKeyRevokeStrategy } from "../api/api-key.types";
import { Button } from "@/components/buttons/CustomButton";
import OutlinedButton from "@/components/buttons/OutlinedButton";
import ConfirmDialog from "@/components/dialog/ConfirmDialog";

export interface ApiKeyStrategyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStrategy: OldKeyRevokeStrategy;
  onSelectStrategy: (strategy: OldKeyRevokeStrategy) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ApiKeyStrategyDialog: React.FC<ApiKeyStrategyDialogProps> = ({
  isOpen,
  onClose,
  selectedStrategy,
  onSelectStrategy,
  onConfirm,
  isLoading = false,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      title="Rotate API Key"
      description="Select when the previous key should be deactivated."
      icon={<RefreshCw className="w-5 h-5 text-primary" />}
      content={
        <div className="flex flex-col gap-4">
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-(--radius) flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <span>
              Rotating will create a brand new Key ID and Secret. Choose how to
              deactivate your current key.
            </span>
          </div>

          {/* Radio Options */}
          <div className="flex flex-col gap-2.5">
            {/* Option 1: 24 Hours */}
            <label
              className={[
                "flex items-start gap-3 p-3 rounded-(--radius) border cursor-pointer transition-all duration-150",
                selectedStrategy === "24_HOURS"
                  ? "border-primary bg-primary/5 shadow-xs"
                  : "border-border hover:bg-muted/40",
              ].join(" ")}
            >
              <input
                type="radio"
                name="revoke-strategy"
                value="24_HOURS"
                checked={selectedStrategy === "24_HOURS"}
                onChange={() => onSelectStrategy("24_HOURS")}
                className="mt-1 text-primary focus:ring-primary"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">
                    Deactivate after 24 hours
                  </span>
                  <span className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded">
                    Recommended
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Zero downtime: Allows existing services to operate while you
                  deploy the new key.
                </p>
              </div>
            </label>

            {/* Option 2: Immediately */}
            <label
              className={[
                "flex items-start gap-3 p-3 rounded-(--radius) border cursor-pointer transition-all duration-150",
                selectedStrategy === "IMMEDIATELY"
                  ? "border-destructive bg-destructive/5 shadow-xs"
                  : "border-border hover:bg-muted/40",
              ].join(" ")}
            >
              <input
                type="radio"
                name="revoke-strategy"
                value="IMMEDIATELY"
                checked={selectedStrategy === "IMMEDIATELY"}
                onChange={() => onSelectStrategy("IMMEDIATELY")}
                className="mt-1 text-destructive focus:ring-destructive"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-destructive" />
                  <span className="text-xs font-semibold text-foreground">
                    Deactivate immediately
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Instantly revokes current key. Recommended if you suspect a
                  security breach.
                </p>
              </div>
            </label>
          </div>
        </div>
      }
      cancelButton={
        <OutlinedButton
          text="Cancel"
          onClick={onClose}
          isDisabled={isLoading}
        />
      }
      confirmButton={
        <Button
          text="Rotate Key"
          color={selectedStrategy === "IMMEDIATELY" ? "destructive" : "primary"}
          onClick={onConfirm}
          isLoading={isLoading}
        />
      }
    />
  );
};

export default ApiKeyStrategyDialog;
