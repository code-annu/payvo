import React, { useEffect } from "react";
import { KeyRound, AlertCircle, ShieldCheck } from "lucide-react";
import { useGetMerchantApiKeys } from "../hooks/useGetMerchantApiKeys";
import { ApiKeyComp } from "../components/ApiKeyComp";
import { useMerchantStore } from "@/app/store/merchant.store";
import { useGetMerchants } from "@/features/merchant/hooks/useGetMerchants";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import { Button } from "@/components/buttons/CustomButton";
import PageTitle from "@/components/text/PageTitle";

export const ApiKeyPage: React.FC = () => {
  const { selectedMerchantId, setSelectedMerchantId } = useMerchantStore(
    (state) => state,
  );
  const { data: merchantsData } = useGetMerchants();
  const { data, isLoading, isError, error, refetch } = useGetMerchantApiKeys();

  // If no merchant is currently selected in store, auto-select the first available merchant
  useEffect(() => {
    if (
      !selectedMerchantId &&
      merchantsData?.merchants &&
      merchantsData.merchants.length > 0
    ) {
      setSelectedMerchantId(merchantsData.merchants[0].id);
    }
  }, [selectedMerchantId, merchantsData, setSelectedMerchantId]);

  const apiKeys = data?.apiKeys ?? [];
  const activeCount = apiKeys.filter((k) => k.status === "ACTIVE").length;
  const revokedCount = apiKeys.filter((k) => k.status === "REVOKED").length;

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 py-2 pb-12">
      <PageTitle title="API Keys" />
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              API Keys
            </h1>
            {apiKeys.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-input">
                {apiKeys.length} {apiKeys.length === 1 ? "Key" : "Keys"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your merchant credentials to integrate Payvo with your
            backend systems.
          </p>
        </div>

        {/* Quick Stats Pill */}
        {apiKeys.length > 0 && (
          <div className="flex items-center gap-3 bg-card border border-border px-3.5 py-1.5 rounded-[calc(var(--radius)+2px)] text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">Active:</span>
              <strong className="text-foreground">{activeCount}</strong>
            </div>
            <span className="text-border">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              <span className="text-muted-foreground">Revoked:</span>
              <strong className="text-foreground">{revokedCount}</strong>
            </div>
          </div>
        )}
      </div>

      {/* ── Content States ── */}
      {!selectedMerchantId ? (
        <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              No Merchant Selected
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Please select or create a merchant using the switcher in the top
              navigation bar to view API keys.
            </p>
          </div>
        </div>
      ) : isLoading ? (
        <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-12 flex flex-col items-center justify-center gap-3">
          <CircularLoadingBar size={36} strokeWidth={3.5} />
          <p className="text-xs text-muted-foreground">
            Loading merchant API keys...
          </p>
        </div>
      ) : isError ? (
        <div className="w-full bg-destructive/5 border border-destructive/20 rounded-[calc(var(--radius)+4px)] p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Failed to load API keys
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {error instanceof Error
                ? error.message
                : "Unable to retrieve API keys for the current merchant."}
            </p>
          </div>
          <Button
            text="Try Again"
            onClick={() => refetch()}
            color="secondary"
            className="mt-2 text-xs h-9 gap-1.5"
          />
        </div>
      ) : apiKeys.length === 0 ? (
        <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              No API Keys Found
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-md">
              There are currently no API keys registered for this merchant.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {apiKeys.map((apiKey) => (
            <ApiKeyComp key={apiKey.id} apiKey={apiKey} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiKeyPage;
