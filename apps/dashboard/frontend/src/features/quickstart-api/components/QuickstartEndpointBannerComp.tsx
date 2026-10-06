import React from "react";
import { Terminal, Copy, Check } from "lucide-react";

export interface QuickstartEndpointBannerCompProps {
  fullEndpoint: string;
  onCopy: (text: string, label: string) => void;
  isCopied: boolean;
}

export const QuickstartEndpointBannerComp: React.FC<
  QuickstartEndpointBannerCompProps
> = ({ fullEndpoint, onCopy, isCopied }) => {
  return (
    <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-(--radius) bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Terminal className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Gateway Target Endpoint (via .env)
          </span>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-(--radius-sm) bg-success/15 text-success font-mono font-bold text-xs">
              POST
            </span>
            <code className="text-xs sm:text-sm font-mono text-foreground font-semibold break-all">
              {fullEndpoint}
            </code>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onCopy(fullEndpoint, "Endpoint URL")}
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-(--radius) bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer border border-input"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Copy URL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default QuickstartEndpointBannerComp;
