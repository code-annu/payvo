import { useEffect, useState, useCallback } from "react";
import PaymentService from "@/service/payment.service";
import type { PaymentOrder, PaymentMethod } from "@/service/payment.types";
import { ApiError } from "@/core/api/api.error";

interface CheckoutOrderData {
  paymentOrder: PaymentOrder;
  paymentMethods: PaymentMethod[];
}

interface UseGetCheckoutOrderReturn {
  data: CheckoutOrderData | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => Promise<CheckoutOrderData | null>;
}

export function useGetCheckoutOrder(csi: string): UseGetCheckoutOrderReturn {
  const [data, setData] = useState<CheckoutOrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOrder = useCallback(async (): Promise<CheckoutOrderData | null> => {
    if (!csi) {
      setIsLoading(false);
      setError(new ApiError(new Error("Missing checkout session identifier")));
      return null;
    }

    try {
      const result = await PaymentService.getCheckoutOrder(csi);
      setData(result);
      return result;
    } catch (err) {
      const apiErr = new ApiError(
        err instanceof Error ? err : new Error(String(err)),
      );
      setError(apiErr);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [csi]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return { data, isLoading, error, refetch: fetchOrder };
}

export default useGetCheckoutOrder;
