import React from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/buttons/CustomButton";

export interface QuickstartPayloadResponseCompProps {
  formattedJsonBody: string;
  dummySuccessResponse: string;
  simulationResponse: string | null;
  isSimulating: boolean;
  onSimulate: () => void;
  onCopy: (text: string, label: string) => void;
  copiedKey: string | null;
}

export const QuickstartPayloadResponseComp: React.FC<
  QuickstartPayloadResponseCompProps
> = ({
  formattedJsonBody,
  dummySuccessResponse,
  simulationResponse,
  isSimulating,
  onSimulate,
  onCopy,
  copiedKey,
}) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Request Payload Card */}
      <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 shadow-2xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              JSON Request Body
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onCopy(formattedJsonBody, "JSON Payload")}
            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Copy body"
          >
            {copiedKey === "JSON Payload" ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        <div className="p-3 rounded-(--radius) bg-muted/30 border border-input font-mono text-xs overflow-x-auto text-foreground">
          <pre>{formattedJsonBody}</pre>
        </div>

        {/* Field breakdown list */}
        <div className="flex flex-col gap-1.5 text-[11px] text-muted-foreground pt-1">
          <div>
            <strong className="text-foreground font-mono">amount</strong>: Smallest
            unit (Paise). <code className="text-primary">20000</code> = ₹200.00
          </div>
          <div>
            <strong className="text-foreground font-mono">merchantOrderId</strong>:
            Unique identifier in your database (UUID).
          </div>
          <div>
            <strong className="text-foreground font-mono">idempotencyKey</strong>:
            Ensures safe retries without duplicate charges.
          </div>
        </div>
      </div>

      {/* Dummy Result / Simulation Box */}
      <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 shadow-2xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Expected Gateway Response
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-success/15 text-success font-semibold border border-success/30">
              201 Created
            </span>
            <button
              type="button"
              onClick={() => onCopy(dummySuccessResponse, "Dummy Response")}
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Copy response"
            >
              {copiedKey === "Dummy Response" ? (
                <Check className="w-3.5 h-3.5 text-success" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          When the gateway verifies your credentials and order parameters, it
          returns a generated{" "}
          <code className="text-primary font-mono">checkoutUrl</code>:
        </p>

        <div className="p-3 rounded-(--radius) bg-muted/30 border border-input font-mono text-xs overflow-x-auto text-foreground">
          <pre>{simulationResponse || dummySuccessResponse}</pre>
        </div>

        <Button
          text={
            isSimulating
              ? "Simulating Gateway Call..."
              : "Simulate Live API Response"
          }
          onClick={onSimulate}
          isLoading={isSimulating}
          color="secondary"
          className="text-xs h-8.5 gap-1.5 w-full mt-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default QuickstartPayloadResponseComp;
