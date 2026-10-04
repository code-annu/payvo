import { useEffect, useState } from "react";
import PaymentApi from "@/api/payment.api";
import type { PaymentOrder, PaymentMethod } from "@/api/payment.types";
import { ApiError } from "@/core/api.error";

interface CheckoutOrderData {
  paymentOrder: PaymentOrder;
  paymentMethods: PaymentMethod[];
}

interface UseGetCheckoutOrderReturn {
  data: CheckoutOrderData | null;
  isLoading: boolean;
  error: ApiError | null;
}

export function useGetCheckoutOrder(csi: string): UseGetCheckoutOrderReturn {
  const [data, setData] = useState<CheckoutOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (!csi) {
      setIsLoading(false);
      setError(new ApiError(new Error("Missing checkout session identifier")));
      return;
    }

    let cancelled = false;

    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await PaymentApi.getCheckoutOrder(csi);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            new ApiError(err instanceof Error ? err : new Error(String(err)))
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOrder();

    return () => {
      cancelled = true;
    };
  }, [csi]);

  return { data, isLoading, error };
}

export default useGetCheckoutOrder;
