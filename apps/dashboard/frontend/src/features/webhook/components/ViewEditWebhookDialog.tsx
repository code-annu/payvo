import React, { useEffect, useState } from "react";
import { Webhook, Trash2, AlertTriangle, Save } from "lucide-react";
import { useGetWebhookDetails } from "../hooks/useGetWebhookDetails";
import { useUpdateWebhook } from "../hooks/useUpdateWebhook";
import { useDeleteWebhook } from "../hooks/useDeleteWebhook";
import { createWebhookSchema } from "../schema/CreateWebhookSchema";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { TextInput } from "@/components/inputs/TextInputField";
import { CopyableField } from "@/components/inputs/CopyableField";
import { Button } from "@/components/buttons/CustomButton";
import { OutlinedButton } from "@/components/buttons/OutlinedButton";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";

export interface ViewEditWebhookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  webhookId: string;
  initialUrl?: string;
}

export const ViewEditWebhookDialog: React.FC<ViewEditWebhookDialogProps> = ({
  isOpen,
  onClose,
  webhookId,
  initialUrl = "",
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [urlError, setUrlError] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const {
    data: webhookDetails,
    isLoading,
    isError,
    error,
  } = useGetWebhookDetails(webhookId, isOpen);

  const updateMutation = useUpdateWebhook();
  const deleteMutation = useDeleteWebhook();

  // Populate url state when details are loaded or dialog opens
  useEffect(() => {
    if (webhookDetails?.url) {
      setUrl(webhookDetails.url);
      setUrlError("");
    } else if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [webhookDetails, initialUrl, isOpen]);

  const handleClose = () => {
    if (updateMutation.isPending || deleteMutation.isPending) return;
    setIsConfirmingDelete(false);
    setUrlError("");
    onClose();
  };

  const validateUrl = (value: string): boolean => {
    const result = createWebhookSchema.safeParse({ url: value.trim() });
    if (!result.success) {
      const issue = result.error.issues[0];
      setUrlError(issue?.message || "Please enter a valid URL.");
      return false;
    }
    setUrlError("");
    return true;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateUrl(url)) return;

    updateMutation.mutate(
      { webhookId, payload: { url: url.trim() } },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(webhookId, {
      onSuccess: () => {
        handleClose();
      },
    });
  };

  const isSaving = updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;
  const hasUrlChanged =
    webhookDetails && url.trim() !== webhookDetails.url.trim();

  // Delete confirmation mode
  if (isConfirmingDelete) {
    return (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={() => !isDeleting && setIsConfirmingDelete(false)}
        title="Delete Webhook Endpoint"
        description="Are you sure you want to remove this webhook endpoint?"
        icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
        variant="destructive"
        disableEscapeKeyDown={isDeleting}
        disableBackdropClick={isDeleting}
        cancelButton={
          <OutlinedButton
            text="Cancel"
            onClick={() => setIsConfirmingDelete(false)}
            isDisabled={isDeleting}
            className="text-xs h-9 px-4"
          />
        }
        confirmButton={
          <Button
            text="Yes, Delete"
            color="destructive"
            isLoading={isDeleting}
            onClick={handleDelete}
            className="text-xs h-9 px-4 gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        }
      >
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-muted-foreground">
          <p>
            This will permanently remove the webhook endpoint{" "}
            <strong className="font-mono text-foreground break-all">
              {webhookDetails?.url || url}
            </strong>
            .
          </p>
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-(--radius) text-destructive text-xs">
            Payvo will immediately stop sending event notifications to this URL.
            This action cannot be undone.
          </div>
        </div>
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Webhook Details"
      description="View credentials, modify endpoint URL, or delete this webhook."
      icon={<Webhook className="w-5 h-5 text-primary" />}
      disableEscapeKeyDown={isSaving || isDeleting}
      disableBackdropClick={isSaving || isDeleting}
      className="max-w-lg"
      cancelButton={
        <OutlinedButton
          text="Close"
          onClick={handleClose}
          isDisabled={isSaving || isDeleting}
          className="text-xs h-9 px-4"
        />
      }
      confirmButton={
        <Button
          text="Save Changes"
          color="primary"
          isLoading={isSaving}
          isDisabled={!hasUrlChanged || isDeleting}
          onClick={handleSave}
          className="text-xs h-9 px-4 gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
        </Button>
      }
    >
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <CircularLoadingBar size={32} strokeWidth={3} />
          <p className="text-xs text-muted-foreground">
            Loading webhook details...
          </p>
        </div>
      ) : isError ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-(--radius) flex flex-col items-start gap-2 text-xs text-destructive">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Failed to load details</span>
          </div>
          <p className="text-muted-foreground">
            {error instanceof Error
              ? error.message
              : "Unable to retrieve details for this webhook endpoint."}
          </p>
        </div>
      ) : webhookDetails ? (
        <div className="flex flex-col gap-4">
          {/* Webhook ID */}
          <CopyableField
            label="Webhook Identifier (UUID)"
            value={webhookDetails.id}
            copySuccessMessage="Webhook ID copied to clipboard!"
            copyTooltip="Copy ID"
            helperText="Unique identifier for this webhook endpoint."
          />

          {/* Secret Key */}
          <CopyableField
            label="Secret Key"
            value={webhookDetails.secretKey}
            isSecret={true}
            canToggleVisibility={true}
            copySuccessMessage="Webhook Secret Key copied to clipboard!"
            copyTooltip="Copy Secret Key"
            helperText="Use this secret to verify signatures on incoming Payvo webhook payloads."
          />

          {/* Editable URL Form */}
          <form onSubmit={handleSave} className="flex flex-col gap-1.5">
            <TextInput
              label="Endpoint URL"
              placeholder="https://api.yourdomain.com/webhooks"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) validateUrl(e.target.value);
              }}
              error={urlError}
              helperText="Payvo sends POST requests to this URL for all subscribed events."
              required
            />
          </form>

          {/* Danger Zone: Delete Webhook */}
          <div className="pt-3 mt-1 border-t border-border flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">
                Delete Endpoint
              </span>
              <span className="text-[11px] text-muted-foreground">
                Permanently stop event delivery and delete this webhook.
              </span>
            </div>
            <Button
              text="Delete"
              color="destructive"
              onClick={() => setIsConfirmingDelete(true)}
              isDisabled={isSaving || isDeleting}
              className="text-xs h-8 px-3 gap-1.5 shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : null}
    </ConfirmDialog>
  );
};

export default ViewEditWebhookDialog;
