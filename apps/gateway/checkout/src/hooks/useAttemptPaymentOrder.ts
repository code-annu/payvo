import { useState, useCallback, useRef, useEffect } from "react";
import PaymentService from "@/service/payment.service";
import type {
  AttemptPaymentResult,
  PaymentOrder,
  PaymentMethod,
} from "@/service/payment.types";
import { ApiError } from "@/core/api/api.error";

interface CheckoutOrderData {
  paymentOrder: PaymentOrder;
  paymentMethods: PaymentMethod[];
}

interface UseAttemptPaymentOrderOptions {
  onSuccess?: (result: AttemptPaymentResult) => void;
  onError?: (error: ApiError) => void;
  onOrderCompleted?: () => void;
  refetchOrder?: () => Promise<CheckoutOrderData | null>;
  pollIntervalMs?: number;
  maxPollAttempts?: number;
}

interface UseAttemptPaymentOrderReturn {
  attemptPayment: (
    paymentOrderId: string,
    paymentMethodCode: string,
  ) => Promise<AttemptPaymentResult | null>;
  isProcessing: boolean;
  error: ApiError | null;
  data: AttemptPaymentResult | null;
  reset: () => void;
}

export function useAttemptPaymentOrder(
  options?: UseAttemptPaymentOrderOptions,
): UseAttemptPaymentOrderReturn {
  const [data, setData] = useState<AttemptPaymentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  const clearPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearPolling();
    setData(null);
    setError(null);
    setIsProcessing(false);
  }, [clearPolling]);

  const attemptPayment = useCallback(
    async (
      paymentOrderId: string,
      paymentMethodCode: string,
    ): Promise<AttemptPaymentResult | null> => {
      clearPolling();
      setIsProcessing(true);
      setError(null);

      try {
        const result = await PaymentService.attemptPayment(
          paymentOrderId,
          paymentMethodCode,
        );

        if (!isMountedRef.current) return null;
        setData(result);
        options?.onSuccess?.(result);

        // If a refetch callback is provided, poll for order completion
        if (options?.refetchOrder) {
          const pollInterval = options.pollIntervalMs ?? 2000;
          const maxAttempts = options.maxPollAttempts ?? 10; // 10 * 2000ms = 20s
          let attempts = 0;

          await new Promise<void>((resolve) => {
            pollTimerRef.current = setInterval(async () => {
              attempts += 1;

              try {
                const refreshed = await options.refetchOrder!();

                if (!isMountedRef.current) {
                  clearPolling();
                  resolve();
                  return;
                }

                // If completedAt is now set, payment succeeded!
                if (refreshed?.paymentOrder?.completedAt) {
                  clearPolling();
                  setIsProcessing(false);
                  options.onOrderCompleted?.();
                  resolve();
                  return;
                }

                // If max polling attempts reached without completion
                if (attempts >= maxAttempts) {
                  clearPolling();
                  setIsProcessing(false);
                  const timeoutErr = new ApiError(
                    new Error(
                      "Payment could not be confirmed. Please check with your bank or try again.",
                    ),
                  );
                  setError(timeoutErr);
                  options.onError?.(timeoutErr);
                  resolve();
                  return;
                }
              } catch (pollErr) {
                // If polling failed, don't crash immediately; retry next tick unless max attempts
                if (attempts >= maxAttempts) {
                  clearPolling();
                  setIsProcessing(false);
                  const errObj = new ApiError(
                    pollErr instanceof Error ? pollErr : new Error(String(pollErr)),
                  );
                  setError(errObj);
                  options.onError?.(errObj);
                  resolve();
                }
              }
            }, pollInterval);
          });
        } else {
          setIsProcessing(false);
        }

        return result;
      } catch (err) {
        if (!isMountedRef.current) return null;
        clearPolling();
        setIsProcessing(false);

        const apiErr = new ApiError(
          err instanceof Error ? err : new Error(String(err)),
        );
        setError(apiErr);
        options?.onError?.(apiErr);
        return null;
      }
    },
    [clearPolling, options],
  );

  return {
    attemptPayment,
    isProcessing,
    error,
    data,
    reset,
  };
}

export default useAttemptPaymentOrder;
