import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Webhook, ShieldAlert, CheckCircle2 } from "lucide-react";
import { useCreateWebhook } from "../hooks/useCreateWebhook";
import type { WebhookDetailsData } from "../api/webhook.types";
import {
  createWebhookSchema,
  type CreateWebhookFormData,
} from "../schema/CreateWebhookSchema";
import { ConfirmDialog } from "@/components/dialog/ConfirmDialog";
import { TextInput } from "@/components/inputs/TextInputField";
import { CopyableField } from "@/components/inputs/CopyableField";
import { Button } from "@/components/buttons/CustomButton";
import { OutlinedButton } from "@/components/buttons/OutlinedButton";

export interface CreateWebhookDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWebhookDialog: React.FC<CreateWebhookDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const [createdWebhook, setCreatedWebhook] =
    useState<WebhookDetailsData | null>(null);

  const createWebhookMutation = useCreateWebhook();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateWebhookFormData>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      url: "",
    },
  });

  const handleClose = () => {
    reset();
    setCreatedWebhook(null);
    onClose();
  };

  const onSubmit = (data: CreateWebhookFormData) => {
    createWebhookMutation.mutate(
      { url: data.url.trim() },
      {
        onSuccess: (resData) => {
          setCreatedWebhook(resData);
          reset();
        },
      },
    );
  };

  if (createdWebhook) {
    return (
      <ConfirmDialog
        isOpen={isOpen}
        onClose={handleClose}
        title="Webhook Created"
        description="Your webhook endpoint has been successfully registered."
        icon={<CheckCircle2 className="w-5 h-5 text-success" />}
        disableEscapeKeyDown={false}
        disableBackdropClick={false}
        confirmButton={
          <Button
            text="Done"
            color="primary"
            onClick={handleClose}
            className="text-xs h-9 px-5"
          />
        }
      >
        <div className="flex flex-col gap-4">
          <div className="p-3.5 bg-warning/10 border border-warning/30 rounded-(--radius) flex items-start gap-2.5 text-xs text-foreground leading-relaxed">
            <ShieldAlert className="w-4.5 h-4.5 text-warning shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-warning">
                Save your Webhook Secret Key!
              </p>
              <p className="text-muted-foreground mt-0.5">
                This secret key will <strong>never be displayed again</strong>.
                Store it safely to verify Payvo webhook signatures.
              </p>
            </div>
          </div>

          <CopyableField
            label="Webhook URL"
            value={createdWebhook.url}
            copySuccessMessage="Webhook URL copied to clipboard!"
            copyTooltip="Copy URL"
          />

          <CopyableField
            label="Secret Key"
            value={createdWebhook.secretKey}
            isSecret={true}
            canToggleVisibility={true}
            copySuccessMessage="Webhook Secret Key copied to clipboard!"
            copyTooltip="Copy Secret Key"
            helperText="Use this secret to compute HMAC SHA256 signatures for payload verification."
          />
        </div>
      </ConfirmDialog>
    );
  }

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        if (!createWebhookMutation.isPending) {
          handleClose();
        }
      }}
      title="Create Webhook"
      description="Register a new URL endpoint to receive real-time events."
      icon={<Webhook className="w-5 h-5 text-primary" />}
      disableEscapeKeyDown={createWebhookMutation.isPending}
      disableBackdropClick={createWebhookMutation.isPending}
      cancelButton={
        <OutlinedButton
          text="Cancel"
          onClick={handleClose}
          isDisabled={createWebhookMutation.isPending}
          className="text-xs h-9 px-4"
        />
      }
      confirmButton={
        <Button
          text="Create Endpoint"
          color="primary"
          isLoading={createWebhookMutation.isPending}
          onClick={handleSubmit(onSubmit)}
          className="text-xs h-9 px-4"
        />
      }
    >
      <form
        id="create-webhook-form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-3"
      >
        <TextInput
          label="Endpoint URL"
          placeholder="https://api.yourdomain.com/webhooks"
          type="url"
          required
          autoFocus
          error={!!errors.url}
          helperText={
            errors.url?.message ||
            "Events will be delivered as POST requests to this URL."
          }
          {...register("url")}
        />
      </form>
    </ConfirmDialog>
  );
};

export default CreateWebhookDialog;
