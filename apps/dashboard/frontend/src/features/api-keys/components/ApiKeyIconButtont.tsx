import React, { useState } from "react";
import type { AxiosError } from "axios";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useMerchantStore } from "@/app/store/merchant.store";
import ApiKeyApi from "../api/api-key.api";
import type { ApiKey } from "../api/api-key.types";
import { ApiError } from "@/core/api/api.error";
import ErrorCode from "@/core/api/ErrorCode";
import ApiKeySaveDialog from "./ApiKeySaveDialog";
import ApiKeyRegenerateDialog from "./ApiKeyRegenerateDialog";
import { useMerchants } from "@/features/merchant/hooks/useMerchants";

export interface ApiKeyIconButtonProps {
  className?: string;
}

/**
 * Animated icon button for API key management in DashboardTopBar.
 * On click:
 * - Spins clockwise with modern loading animation.
 * - Fetches active API key for the selected merchant.
 * - If not found (API_KEY_NOT_FOUND), automatically generates a new key and shows ApiKeySaveDialog.
 * - If found, shows ApiKeyRegenerateDialog with rotation options.
 */
export const ApiKeyIconButton: React.FC<ApiKeyIconButtonProps> = ({
  className = "",
}) => {
  const { selectedMerchantId, setSelectedMerchantId } = useMerchantStore();
  const { data: merchantsData } = useMerchants();

  const [isLoading, setIsLoading] = useState(false);
  const [saveKeyData, setSaveKeyData] = useState<ApiKey | null>(null);
  const [regenerateKeyData, setRegenerateKeyData] = useState<ApiKey | null>(
    null,
  );

  const effectiveMerchantId =
    selectedMerchantId || (merchantsData?.merchants?.[0]?.id ?? null);

  const handleClick = async () => {
    if (!effectiveMerchantId) {
      toast.warning("No merchant selected", {
        description: "Please select or create a merchant first.",
      });
      return;
    }

    if (!selectedMerchantId && effectiveMerchantId) {
      setSelectedMerchantId(effectiveMerchantId);
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      // 1. Try to fetch the active key
      const activeKey = await ApiKeyApi.getMerchantActiveApiKey(
        effectiveMerchantId,
        "LIVE",
      );

      if (activeKey && activeKey.keyId) {
        setRegenerateKeyData(activeKey);
      } else {
        throw new Error("API_KEY_NOT_FOUND");
      }
    } catch (error) {
      const err = new ApiError(error as AxiosError | Error);
      // 2. If no key found, automatically generate one
      if (err.code === ErrorCode.API_KEY_NOT_FOUND) {
        try {
          const newKey = await ApiKeyApi.generateApiKey(
            effectiveMerchantId,
            "LIVE",
          );
          setSaveKeyData(newKey);
        } catch (genError) {
          const genErr = new ApiError(genError as AxiosError | Error);
          toast.error("Failed to generate API key", {
            description: genErr.message,
          });
        }
      } else {
        toast.error("Failed to retrieve API key", {
          description: err.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        aria-label="API Keys"
        title="API Keys"
        className={[
          "inline-flex items-center justify-center w-9 h-9 rounded-full",
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 transition-all duration-200 cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isLoading ? "opacity-90 cursor-wait" : "active:scale-95",
          className,
        ].join(" ")}
      >
        <KeyRound
          className={[
            "w-4.5 h-4.5 transition-transform duration-700 ease-in-out",
            isLoading
              ? "animate-spin text-primary"
              : "text-foreground hover:rotate-12",
          ].join(" ")}
        />
      </button>

      {/* Save Dialog for Newly Generated or Rotated Key */}
      <ApiKeySaveDialog
        isOpen={Boolean(saveKeyData)}
        onClose={() => setSaveKeyData(null)}
        apiKey={saveKeyData}
        merchantId={effectiveMerchantId ?? ""}
      />

      {/* Regenerate / View Dialog for Existing Key */}
      <ApiKeyRegenerateDialog
        isOpen={Boolean(regenerateKeyData)}
        onClose={() => setRegenerateKeyData(null)}
        apiKey={regenerateKeyData}
        merchantId={effectiveMerchantId ?? ""}
        onRegenerateSuccess={(newRotatedKey) => {
          setRegenerateKeyData(null);
          setSaveKeyData(newRotatedKey);
        }}
      />
    </>
  );
};

export default ApiKeyIconButton;
