import React from "react";
import { Workflow, CreditCard, Webhook, CheckCircle2, ArrowRight } from "lucide-react";

export interface QuickstartNextStepsCompProps {
  onNavigateToWebhooks: () => void;
  onNavigateToTransactions: () => void;
}

export const QuickstartNextStepsComp: React.FC<QuickstartNextStepsCompProps> = ({
  onNavigateToWebhooks,
  onNavigateToTransactions,
}) => {
  return (
    <div className="flex flex-col gap-4 pt-4 border-t border-border">
      <div>
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            Further Steps Taken by You
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          What happens after creating a payment order? Follow this standard
          3-step integration flow:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
              1
            </span>
            <CreditCard className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Redirect Customer to Checkout
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Take the returned{" "}
            <code className="font-mono text-primary">checkoutUrl</code> and
            redirect the buyer’s browser or render it inside an in-app webview.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
              2
            </span>
            <Webhook className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Receive Webhook Event
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Upon buyer completion or failure, Payvo triggers an automated
            webhook event to your server endpoint with cryptographic signature.
          </p>
          <button
            type="button"
            onClick={onNavigateToWebhooks}
            className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-auto pt-1 cursor-pointer"
          >
            Setup Webhook URL <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Step 3 */}
        <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 flex flex-col gap-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
              3
            </span>
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            Verify Signature & Fulfill
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Verify the HMAC signature on your backend using your webhook secret.
            Once confirmed, unlock premium access or deliver goods.
          </p>
          <button
            type="button"
            onClick={onNavigateToTransactions}
            className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-auto pt-1 cursor-pointer"
          >
            View Transactions <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickstartNextStepsComp;
