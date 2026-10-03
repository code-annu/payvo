import type React from "react";
import { useMerchantStore } from "@/app/store/merchant.store";
import { useCreateMerchant } from "../hooks/useCreateMerchant";
import { Button } from "@/components/buttons/CustomButton";
import DropdownMenu from "@/components/menu/DropdownMenu";
import MerchantItem from "./MerchantItem";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import ErrorText from "@/components/text/ErrorText";
import { useGetMerchants } from "../hooks/useGetMerchants";

export interface MerchantSwitcherMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Dropdown to list, switch, and create merchants.
 * Uses the generic DropdownMenu shell with merchant-specific content.
 */
export const MerchantSwitcherMenu: React.FC<MerchantSwitcherMenuProps> = ({
  isOpen,
  onClose,
}) => {
  const { selectedMerchantId, setSelectedMerchantId } = useMerchantStore(
    (state) => state,
  );
  const { data, isLoading, error, isError } = useGetMerchants();
  const createMerchant = useCreateMerchant(() => onClose());

  const handleSwitch = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    onClose();
  };

  const handleCreate = () => {
    createMerchant.mutate();
  };

  // ── Build the merchant list body ─────────────────────────
  let body: React.ReactNode;

  if (isLoading) {
    body = (
      <div className="flex items-center justify-center py-8">
        <CircularLoadingBar size={32} strokeWidth={3} />
      </div>
    );
  } else if (isError) {
    body = (
      <div className="py-3 px-1">
        <ErrorText
          message={
            error instanceof Error
              ? error.message
              : "Failed to load merchants. Please try again."
          }
        />
      </div>
    );
  } else if (!data || data.merchants.length === 0) {
    body = (
      <p className="text-sm text-muted-foreground text-center py-6">
        No merchants found.
      </p>
    );
  } else {
    body = (
      <ul className="flex flex-col gap-1">
        {data.merchants.map((merchant, index) => (
          <li key={merchant.id}>
            <MerchantItem
              merchant={merchant}
              index={index + 1}
              isSelected={merchant.id === selectedMerchantId}
              onSelect={handleSwitch}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <DropdownMenu
      isOpen={isOpen}
      onClose={onClose}
      title="Switch Merchant"
      ariaLabel="Switch merchant"
      footer={
        !isError ? (
          <Button
            text="Create New Merchant"
            color="primary"
            onClick={handleCreate}
            isLoading={createMerchant.isPending}
            className="w-full h-9 text-sm gap-2"
          />
        ) : undefined
      }
    >
      {body}
    </DropdownMenu>
  );
};

export default MerchantSwitcherMenu;
