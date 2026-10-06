import React from "react";
import { ShieldCheck } from "lucide-react";

export interface QuickstartAuthStatusCompProps {
  activeKeyId?: string;
  useRealApiKey: boolean;
  onToggleUseRealApiKey: (checked: boolean) => void;
}

export const QuickstartAuthStatusComp: React.FC<
  QuickstartAuthStatusCompProps
> = ({ activeKeyId, useRealApiKey, onToggleUseRealApiKey }) => {
  return (
    <div className="bg-secondary/40 border border-input rounded-(--radius) px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
        <div>
          <span className="text-foreground font-medium">
            Authentication Credentials:
          </span>{" "}
          {activeKeyId ? (
            <span className="text-muted-foreground">
              Active merchant key found (
              <span className="font-mono text-foreground font-semibold">
                {activeKeyId.substring(0, 8)}...
              </span>
              )
            </span>
          ) : (
            <span className="text-warning font-medium">
              No active API key detected. Create one in API Keys page.
            </span>
          )}
        </div>
      </div>

      {activeKeyId && (
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={useRealApiKey}
            onChange={(e) => onToggleUseRealApiKey(e.target.checked)}
            className="rounded accent-primary cursor-pointer w-4 h-4"
          />
          <span className="text-foreground font-medium text-xs">
            Use my active Key ID in code
          </span>
        </label>
      )}
    </div>
  );
};

export default QuickstartAuthStatusComp;
