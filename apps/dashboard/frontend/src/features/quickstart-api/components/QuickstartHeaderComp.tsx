import React from "react";
import { ArrowLeft, KeyRound, Webhook } from "lucide-react";
import { Button } from "@/components/buttons/CustomButton";
import { OutlinedButton } from "@/components/buttons/OutlinedButton";

export interface QuickstartHeaderCompProps {
  onBack: () => void;
  onManageApiKeys: () => void;
  onConfigureWebhooks: () => void;
}

export const QuickstartHeaderComp: React.FC<QuickstartHeaderCompProps> = ({
  onBack,
  onManageApiKeys,
  onConfigureWebhooks,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Payment Order Quickstart API
            </h1>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              POST /api/payment-orders/
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
            Generate payment orders programmatically from your backend, retrieve
            instant checkout URLs for your customers, and verify payments in real
            time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <OutlinedButton
            text="Manage API Keys"
            onClick={onManageApiKeys}
            className="text-xs h-9 px-3.5 gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </OutlinedButton>
          <Button
            text="Configure Webhooks"
            onClick={onConfigureWebhooks}
            color="secondary"
            className="text-xs h-9 px-3.5 gap-1.5"
          >
            <Webhook className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QuickstartHeaderComp;
