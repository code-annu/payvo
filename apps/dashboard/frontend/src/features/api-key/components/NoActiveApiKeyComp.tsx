import type React from "react";
import { KeyRound, Sparkles, ShieldCheck } from "lucide-react";
import type { ApiKeyEnvironment } from "../api/api-key.types";
import { Button } from "@/components/buttons/CustomButton";

export interface NoActiveApiKeyCompProps {
  environment: ApiKeyEnvironment;
  onGenerate: () => void;
  isGenerating?: boolean;
}

export const NoActiveApiKeyComp: React.FC<NoActiveApiKeyCompProps> = ({
  environment,
  onGenerate,
  isGenerating = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-6 sm:p-8 gap-5 bg-card border border-dashed border-border rounded-[calc(var(--radius)+4px)]">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/10">
        <KeyRound className="w-7 h-7" />
      </div>

      <div className="flex flex-col gap-1.5 max-w-md">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-base sm:text-lg font-bold text-foreground">
            No Active {environment} API Key
          </h3>
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-secondary text-secondary-foreground border border-input">
            {environment}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          You don&apos;t have an active {environment.toLowerCase()} key for this
          merchant. Generate a new API key to authenticate requests from your
          backend or checkout application.
        </p>
      </div>

      <div className="w-full max-w-sm p-3 bg-muted/40 border border-border/80 rounded-(--radius) flex items-start gap-2.5 text-left text-xs text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <span>
          Your generated secret will be shown{" "}
          <strong className="text-foreground">once</strong>. Store it securely
          in your environment variables or secret manager.
        </span>
      </div>

      <Button
        text={`Generate ${environment} Key`}
        color="primary"
        onClick={onGenerate}
        isLoading={isGenerating}
        className="w-full sm:w-auto h-10 px-6 gap-2 text-sm"
      >
        <Sparkles className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default NoActiveApiKeyComp;
