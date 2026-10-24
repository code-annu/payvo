import { useCallback, useEffect, useRef } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import { AppRoutes } from "./routes.ts";
import { useUserMerchants } from "@/features/merchant/hooks/merchant-query.hook.ts";
import { useCreateMerchant } from "@/features/merchant/hooks/merchant-mutation.hook.ts";
import { useMerchantStore } from "@/app/store/merchant.store.ts";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar.tsx";

export default function MerchantGuard() {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useUserMerchants();
  const selectedMerchantId = useMerchantStore(
    (state) => state.selectedMerchantId,
  );
  const setSelectedMerchantId = useMerchantStore(
    (state) => state.setSelectedMerchantId,
  );
  const creationStarted = useRef(false);

  const handleCreateError = useCallback(() => {
    navigate(AppRoutes.LOGIN, { replace: true });
  }, [navigate]);
  const handleCreateSuccess = useCallback(
    (merchant: { id: string }) => setSelectedMerchantId(merchant.id),
    [setSelectedMerchantId],
  );
  const createMerchant = useCreateMerchant(
    handleCreateError,
    handleCreateSuccess,
  );

  useEffect(() => {
    if (isLoading || isError || !data) return;

    if (data.merchants.length === 0) {
      if (!creationStarted.current) {
        creationStarted.current = true;
        createMerchant.mutate();
      }
      return;
    }

    const selectedMerchantExists = data.merchants.some(
      (merchant) => merchant.id === selectedMerchantId,
    );
    if (!selectedMerchantExists) {
      const merchant =
        data.merchants.find((item) => item.status === "ACTIVE") ??
        data.merchants[0];
      setSelectedMerchantId(merchant!.id);
    }
  }, [
    createMerchant,
    data,
    isError,
    isLoading,
    selectedMerchantId,
    setSelectedMerchantId,
  ]);

  if (isError) return <Navigate to={AppRoutes.LOGIN} replace />;

  const hasMerchants = Boolean(data?.merchants.length);
  if (isLoading || createMerchant.isPending || !hasMerchants) {
    return (
      <main className="flex min-h-[50vh] items-center justify-center bg-background text-foreground">
        <CircularLoadingBar size={44} label="Loading your merchant workspace" />
      </main>
    );
  }

  return <Outlet />;
}
