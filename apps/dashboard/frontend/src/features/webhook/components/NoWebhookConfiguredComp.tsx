import type React from "react";
import { Webhook, Plus } from "lucide-react";
import { Button } from "@/components/buttons/CustomButton";

export interface NoWebhookConfiguredCompProps {
  onCreateWebhook: () => void;
}

export const NoWebhookConfiguredComp: React.FC<NoWebhookConfiguredCompProps> = ({
  onCreateWebhook,
}) => {
  return (
    <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-12 flex flex-col items-center justify-center text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
        <Webhook className="w-6 h-6" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-foreground">
          No Webhooks Configured
        </h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-md">
          There are currently no webhook endpoints registered for this merchant. Add an endpoint to start receiving events.
        </p>
      </div>
      <Button
        text="Create Webhook"
        onClick={onCreateWebhook}
        color="primary"
        className="text-xs h-9 px-4 gap-1.5"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default NoWebhookConfiguredComp;
