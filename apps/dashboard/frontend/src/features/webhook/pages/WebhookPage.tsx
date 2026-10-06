import React, { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { useGetMerchantWebhooks } from "../hooks/useGetMerchantWebhooks";
import { WebhookInfoComp } from "../components/WebhookInfoComp";
import { CreateWebhookDialog } from "../components/CreateWebhookDialog";
import { NoWebhookConfiguredComp } from "../components/NoWebhookConfiguredComp";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import { Button } from "@/components/buttons/CustomButton";
import PageTitle from "@/components/text/PageTitle";

export const WebhookPage: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useGetMerchantWebhooks();

  const webhooks = data?.webhooks ?? [];

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 py-2 pb-12">
      <PageTitle title="Webhooks" />

      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Webhooks
            </h1>
            {webhooks.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-input">
                {webhooks.length}{" "}
                {webhooks.length === 1 ? "Webhook" : "Webhooks"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Configure webhook endpoints to receive real-time event notifications
            from Payvo.
          </p>
        </div>

        {/* Top Right Action Button */}
        <Button
          text="Create Webhook"
          color="primary"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs h-9 px-4 gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* ── Content States ── */}
      {isLoading ? (
        <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-12 flex flex-col items-center justify-center gap-3">
          <CircularLoadingBar size={36} strokeWidth={3.5} />
          <p className="text-xs text-muted-foreground">
            Loading merchant webhooks...
          </p>
        </div>
      ) : isError ? (
        <div className="w-full bg-destructive/5 border border-destructive/20 rounded-[calc(var(--radius)+4px)] p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Failed to load webhooks
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {error instanceof Error
                ? error.message
                : "Unable to retrieve webhooks for the current merchant."}
            </p>
          </div>
          <Button
            text="Try Again"
            onClick={() => refetch()}
            color="secondary"
            className="mt-2 text-xs h-9 gap-1.5"
          />
        </div>
      ) : webhooks.length === 0 ? (
        <NoWebhookConfiguredComp
          onCreateWebhook={() => setIsCreateOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {webhooks.map((webhook) => (
            <WebhookInfoComp key={webhook.id} webhook={webhook} />
          ))}
        </div>
      )}

      {/* ── Create Webhook Dialog ── */}
      <CreateWebhookDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
};

export default WebhookPage;
