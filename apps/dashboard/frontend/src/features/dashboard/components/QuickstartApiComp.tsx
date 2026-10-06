import React, { useState } from "react";
import { KeyRound, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export interface QuickstartApiCompProps {
  curlSnippet?: string;
}

const DEFAULT_CURL_SNIPPET = `curl -X POST https://api.payvo.dev/v1/orders \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "50000",
    "currency": "INR",
    "merchantOrderId": "ORD_DEMO_01"
  }'`;

export const QuickstartApiComp: React.FC<QuickstartApiCompProps> = ({
  curlSnippet = DEFAULT_CURL_SNIPPET,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(curlSnippet);
      setCopied(true);
      toast.success("cURL command copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  return (
    <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-6 flex flex-col gap-4 shadow-2xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary/10 text-primary flex items-center justify-center">
            <KeyRound className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-sm font-bold text-foreground">Quickstart API</h3>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy snippet"
          className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-success" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground">
        Create a payment order in seconds by sending a POST request with your
        secret key.
      </p>

      <div className="bg-muted/40 border border-input rounded-(--radius) p-3 font-mono text-[11px] text-foreground overflow-x-auto leading-relaxed">
        <pre className="whitespace-pre">{curlSnippet}</pre>
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <span>Amount is in Paise (INR)</span>
        <span className="font-mono text-primary font-medium">50000 = ₹500</span>
      </div>
    </div>
  );
};

export default QuickstartApiComp;
