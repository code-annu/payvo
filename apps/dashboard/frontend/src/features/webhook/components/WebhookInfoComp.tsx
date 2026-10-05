import React, { useState } from "react";
import { Webhook, ShieldCheck, Edit3 } from "lucide-react";
import type { WebhookListItem } from "../api/webhook.types";
import CopyableField from "@/components/inputs/CopyableField";
import { Button } from "@/components/buttons/CustomButton";
import { ViewEditWebhookDialog } from "./ViewEditWebhookDialog";

export interface WebhookInfoCompProps {
  webhook: WebhookListItem;
  onViewEdit?: (webhook: WebhookListItem) => void;
}

export const WebhookInfoComp: React.FC<WebhookInfoCompProps> = ({
  webhook,
  onViewEdit,
}) => {
  const [isViewEditOpen, setIsViewEditOpen] = useState(false);

  const handleViewEdit = () => {
    setIsViewEditOpen(true);
    onViewEdit?.(webhook);
  };

  return (
    <>
      <div className="relative bg-card text-card-foreground border border-border rounded-[calc(var(--radius)+4px)] p-5 sm:p-6 transition-all duration-200 shadow-xs hover:border-border/80 flex flex-col gap-4">
        {/* ── Top Header: Endpoint badge, Status & Action ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-(--radius) bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Webhook className="w-4.5 h-4.5" />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-(--radius-sm) uppercase tracking-wider bg-secondary text-secondary-foreground border border-input">
                ENDPOINT
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success border border-success/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                Active
              </span>
            </div>
          </div>

          {/* View and Edit Button */}
          <div className="flex items-center gap-2">
            <Button
              text="View & Edit"
              color="secondary"
              onClick={handleViewEdit}
              className="text-xs h-8 px-3 gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* ── Webhook URL Display ── */}
        <div className="flex flex-col gap-1">
          <CopyableField
            label="Webhook URL"
            value={webhook.url}
            copySuccessMessage="Webhook URL copied to clipboard!"
            copyTooltip="Copy webhook URL"
            helperText="Payloads for subscribed events will be sent to this endpoint via POST."
          />
        </div>
      </div>

      {/* ── View & Edit Webhook Dialog ── */}
      <ViewEditWebhookDialog
        isOpen={isViewEditOpen}
        onClose={() => setIsViewEditOpen(false)}
        webhookId={webhook.id}
        initialUrl={webhook.url}
      />
    </>
  );
};

export default WebhookInfoComp;
