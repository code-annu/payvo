import React from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/buttons/CustomButton";
import OutlinedButton from "@/components/buttons/OutlinedButton";
import ConfirmDialog from "@/components/dialog/ConfirmDialog";

export interface UnsavedKeyWarningDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCloseAnyway: () => void;
}

export const UnsavedKeyWarningDialog: React.FC<UnsavedKeyWarningDialogProps> = ({
  isOpen,
  onClose,
  onConfirmCloseAnyway,
}) => {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Unsaved Secret Key"
      description="Your secret key will never be visible again."
      variant="destructive"
      icon={<ShieldAlert className="w-5 h-5" />}
      content={
        <div className="text-xs text-muted-foreground leading-relaxed">
          You haven&apos;t copied both your Key ID and Key Secret. If you leave
          now, you will permanently lose access to this secret and will need to
          rotate your key.
        </div>
      }
      cancelButton={
        <OutlinedButton text="Go Back & Save" onClick={onClose} />
      }
      confirmButton={
        <Button
          text="Close Anyway"
          color="destructive"
          onClick={onConfirmCloseAnyway}
        />
      }
    />
  );
};

export default UnsavedKeyWarningDialog;
