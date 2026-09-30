import React, { useState, useCallback } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useDeleteUser } from "../hooks/useDeleteUser";
import { Button } from "@/components/buttons/CustomButton";
import OutlinedButton from "@/components/buttons/OutlinedButton";
import { TextInput } from "@/components/inputs/TextInputField";
import ConfirmDialog from "@/components/dialog/ConfirmDialog";

const CONFIRMATION_KEYWORD = "DELETE";

export const AccountDeleteSection: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const deleteUser = useDeleteUser();

  const handleOpen = () => {
    setConfirmInput("");
    setIsModalOpen(true);
  };

  const handleClose = useCallback(() => {
    if (deleteUser.isPending) return;
    setIsModalOpen(false);
    setConfirmInput("");
  }, [deleteUser.isPending]);

  const handleDelete = () => {
    if (confirmInput.trim() !== CONFIRMATION_KEYWORD) return;
    deleteUser.mutate();
  };

  return (
    <>
      <div className="w-full bg-destructive/5 border border-destructive/30 rounded-[calc(var(--radius)+4px)] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-(--radius) bg-destructive/10 text-destructive shrink-0 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tracking-wider uppercase text-destructive">
                  Danger Zone
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-foreground mt-0.5">
                Delete this account
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
                Permanently delete your PayO account, organizations, and all
                associated merchants, API keys, and transaction records. Once
                deleted, this action is irreversible.
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Button
              text="Delete Account"
              color="destructive"
              onClick={handleOpen}
              className="gap-2"
            />
          </div>
        </div>
      </div>

      {/* Safety Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isModalOpen}
        onClose={handleClose}
        title="Delete Account"
        description="This action cannot be undone."
        icon={<Trash2 className="w-5 h-5" />}
        variant="destructive"
        content={
          <div className="flex flex-col gap-4">
            {/* Warning Message */}
            <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-(--radius) text-xs text-destructive leading-relaxed">
              <strong>Warning:</strong> Deleting your account will immediately revoke
              all active sessions, API keys, webhook endpoints, and data associated
              with your merchants.
            </div>

            {/* Confirmation Input */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirm-delete-input"
                className="text-xs font-semibold text-foreground select-none"
              >
                Type <span className="font-mono font-bold text-destructive">{CONFIRMATION_KEYWORD}</span> to confirm:
              </label>
              <TextInput
                id="confirm-delete-input"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder={`Type ${CONFIRMATION_KEYWORD}`}
                disabled={deleteUser.isPending}
                autoFocus
                className="font-mono text-sm"
              />
            </div>
          </div>
        }
        cancelButton={
          <OutlinedButton
            text="Cancel"
            onClick={handleClose}
            isDisabled={deleteUser.isPending}
          />
        }
        confirmButton={
          <Button
            text="Permanently Delete"
            color="destructive"
            onClick={handleDelete}
            isLoading={deleteUser.isPending}
            isDisabled={
              confirmInput.trim() !== CONFIRMATION_KEYWORD ||
              deleteUser.isPending
            }
          />
        }
      />
    </>
  );
};

export default AccountDeleteSection;
