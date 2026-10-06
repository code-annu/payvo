import React from "react";
import { Code2, Copy, Check } from "lucide-react";

export type LanguageTab = "curl" | "javascript" | "python";

export interface QuickstartCodeSnippetsCompProps {
  snippets: {
    curl: string;
    javascript: string;
    python: string;
  };
  activeTab: LanguageTab;
  onTabChange: (tab: LanguageTab) => void;
  onCopy: (text: string, label: string) => void;
  copiedKey: string | null;
}

export const QuickstartCodeSnippetsComp: React.FC<
  QuickstartCodeSnippetsCompProps
> = ({ snippets, activeTab, onTabChange, onCopy, copiedKey }) => {
  const currentSnippet = snippets[activeTab];
  const copyLabel = `${activeTab.toUpperCase()} Snippet`;
  const isCopied = copiedKey === copyLabel;

  return (
    <div className="flex flex-col gap-4">
      {/* Code Card */}
      <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] shadow-2xs overflow-hidden flex flex-col">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border">
          <div className="flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-primary mr-1" />
            <button
              type="button"
              onClick={() => onTabChange("curl")}
              className={`px-3 py-1 text-xs font-medium rounded-(--radius-sm) transition-colors cursor-pointer ${
                activeTab === "curl"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              cURL
            </button>
            <button
              type="button"
              onClick={() => onTabChange("javascript")}
              className={`px-3 py-1 text-xs font-medium rounded-(--radius-sm) transition-colors cursor-pointer ${
                activeTab === "javascript"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Node.js / JS
            </button>
            <button
              type="button"
              onClick={() => onTabChange("python")}
              className={`px-3 py-1 text-xs font-medium rounded-(--radius-sm) transition-colors cursor-pointer ${
                activeTab === "python"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Python
            </button>
          </div>

          <button
            type="button"
            onClick={() => onCopy(currentSnippet, copyLabel)}
            title="Copy snippet"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-muted transition-colors cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="text-success text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Block Container */}
        <div className="p-4 bg-muted/20 overflow-x-auto text-xs font-mono text-foreground leading-relaxed">
          <pre className="whitespace-pre">{currentSnippet}</pre>
        </div>

        {/* Code Footer Notes */}
        <div className="px-4 py-3 bg-muted/10 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>* Replace secret key with your actual generated secret</span>
          <span className="font-mono text-foreground font-medium">
            20000 = ₹200.00
          </span>
        </div>
      </div>

      {/* Headers Reference Table */}
      <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 shadow-2xs flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Required Headers
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-1.5 font-semibold">Header Name</th>
                <th className="py-1.5 font-semibold">Value Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-2 font-mono font-medium text-foreground">
                  Content-Type
                </td>
                <td className="py-2 text-muted-foreground">application/json</td>
              </tr>
              <tr>
                <td className="py-2 font-mono font-medium text-primary">
                  x-api-key-id
                </td>
                <td className="py-2 text-muted-foreground">
                  Your merchant API Key Identifier (UUID)
                </td>
              </tr>
              <tr>
                <td className="py-2 font-mono font-medium text-primary">
                  x-api-key-secret
                </td>
                <td className="py-2 text-muted-foreground">
                  Your raw API key secret provided during key creation
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuickstartCodeSnippetsComp;
