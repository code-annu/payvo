import { useState, useCallback } from "react";
import { useGetCheckoutOrder } from "@/hooks/useGetCheckoutOrder";
import { useAttemptPaymentOrder } from "@/hooks/useAttemptPaymentOrder";
import { SelectablePaymentMethod } from "@/components/SelectablePaymentMethod";
import { CardPaymentForm } from "@/components/CardPaymentForm";
import { UpiPaymentForm } from "@/components/UpiPaymentForm";
import { NetBankingPaymentForm } from "@/components/NetBankingPaymentForm";
import { ConfirmPaymentButton } from "@/components/ConfirmPaymentButton";
import { CheckoutUnavailableComp } from "@/components/CheckoutUnavailableComp";
import { LoadingBar } from "@/components/LoadingBar";
import { OrderDetailsStripe } from "@/components/OrderDetailsStripe";
import { OrderExpiredComp } from "@/components/OrderExpiredComp";
import { OrderCompletedComp } from "@/components/OrderCompletedComp";
import { CompletedExpiredPayment } from "@/components/CompletedExpiredPayment";
import { ProcessingPaymentComp } from "@/components/ProcessingPaymentComp";
import AmountUtil from "@/core/util/amount.util";
import DateTimeUtil from "@/core/util/date-time.util";
import type { CardPaymentFormData } from "@/schemas/CardPaymentSchema";
import type { UpiPaymentFormData } from "@/schemas/UpiPaymentSchema";
import type { NetBankingFormData } from "@/schemas/NetBankingSchema";

const PAYMENT_FORM_ID = "payment-form";

export function CheckoutPage() {
  // Extract CSI from URL search params
  const csi = new URLSearchParams(window.location.search).get("csi") ?? "";
  const { data, isLoading, error, refetch } = useGetCheckoutOrder(csi);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [isExpiredByTimer, setIsExpiredByTimer] = useState(false);

  const {
    attemptPayment,
    isProcessing,
    error: attemptError,
  } = useAttemptPaymentOrder({
    refetchOrder: refetch,
  });

  // Auto-select first method when data loads
  if (data && !selectedMethod && data.paymentMethods.length > 0) {
    setSelectedMethod(data.paymentMethods[0].code);
  }

  const handleFormSubmit = async (
    _formData: CardPaymentFormData | UpiPaymentFormData | NetBankingFormData,
  ) => {
    if (!data?.paymentOrder.id || !selectedMethod) return;
    await attemptPayment(data.paymentOrder.id, selectedMethod);
  };

  const handleExpire = useCallback(() => {
    setIsExpiredByTimer(true);
  }, []);

  // ─── Loading State ───
  if (isLoading) {
    return <LoadingBar />;
  }

  // ─── Error / Unavailable State ───
  if (error || !data) {
    return <CheckoutUnavailableComp message={error?.message} />;
  }

  const { paymentOrder, paymentMethods } = data;

  const isOrderExpired =
    DateTimeUtil.isExpired(paymentOrder.expiresAt) || isExpiredByTimer;

  // ─── Order Completed & Expired State ───
  if (paymentOrder.completedAt && isOrderExpired) {
    return (
      <CompletedExpiredPayment
        orderNumber={paymentOrder.orderNumber}
        orderId={paymentOrder.id}
        amount={paymentOrder.amount}
        currency={paymentOrder.currency}
      />
    );
  }

  // ─── Order Completed (Not Expired) State ───
  if (paymentOrder.completedAt) {
    return (
      <OrderCompletedComp
        orderNumber={paymentOrder.orderNumber}
        orderId={paymentOrder.id}
        amount={paymentOrder.amount}
        currency={paymentOrder.currency}
      />
    );
  }

  // ─── Order Expired State (initial load or timer-driven) ───
  if (isOrderExpired) {
    return (
      <OrderExpiredComp
        orderNumber={paymentOrder.orderNumber}
        orderId={paymentOrder.id}
      />
    );
  }

  // ─── Processing Payment State ───
  if (isProcessing) {
    return (
      <ProcessingPaymentComp
        orderNumber={paymentOrder.orderNumber}
        orderId={paymentOrder.id}
        amount={paymentOrder.amount}
        currency={paymentOrder.currency}
        paymentMethod={selectedMethod}
      />
    );
  }

  // ─── Main Checkout ───
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl">
        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* ─── Header: Order Summary Bar ─── */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 sm:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">
                    Secure Checkout
                  </h1>
                  <p className="text-indigo-200 text-xs">
                    256-bit SSL encrypted
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-indigo-200 text-xs font-medium">
                  Total Amount
                </p>
                <p className="text-white text-2xl font-bold tracking-tight">
                  {AmountUtil.formatAmount(
                    paymentOrder.amount,
                    paymentOrder.currency,
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Order Details Strip ─── */}
          <OrderDetailsStripe
            orderNumber={paymentOrder.orderNumber}
            orderId={paymentOrder.id}
            currency={paymentOrder.currency}
            expiresAt={paymentOrder.expiresAt}
            onExpire={handleExpire}
          />

          {/* ─── Body: Payment Methods + Form ─── */}
          <div className="px-6 sm:px-8 py-8">
            {/* Payment Attempt Error Banner if previous attempt failed */}
            {attemptError && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 flex items-start gap-3 animate-fade-in">
                <div className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5">
                  <svg
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-800">
                    Payment Failed
                  </p>
                  <p className="text-xs text-red-600 mt-0.5">
                    {attemptError.message}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left: Payment Methods */}
              <div className="lg:w-[280px] flex-shrink-0">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Payment Method
                </h2>
                <SelectablePaymentMethod
                  methods={paymentMethods}
                  selectedCode={selectedMethod}
                  onSelect={setSelectedMethod}
                />
              </div>

              {/* Divider */}
              <div className="hidden lg:block w-px bg-slate-100" />
              <div className="lg:hidden h-px bg-slate-100" />

              {/* Right: Form + Button */}
              <div className="flex-1 flex flex-col min-w-0">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  {selectedMethod === "upi" && "UPI Details"}
                  {selectedMethod === "card" && "Card Details"}
                  {selectedMethod === "net_banking" && "Net Banking"}
                </h2>

                <div className="flex-1">
                  {selectedMethod === "card" && (
                    <CardPaymentForm
                      formId={PAYMENT_FORM_ID}
                      onSubmit={handleFormSubmit}
                    />
                  )}
                  {selectedMethod === "upi" && (
                    <UpiPaymentForm
                      formId={PAYMENT_FORM_ID}
                      onSubmit={handleFormSubmit}
                    />
                  )}
                  {selectedMethod === "net_banking" && (
                    <NetBankingPaymentForm
                      formId={PAYMENT_FORM_ID}
                      onSubmit={handleFormSubmit}
                    />
                  )}
                </div>

                <div className="mt-8">
                  <ConfirmPaymentButton
                    formId={PAYMENT_FORM_ID}
                    amount={paymentOrder.amount}
                    currency={paymentOrder.currency}
                  />
                  <p className="text-center text-xs text-slate-400 mt-3">
                    Your payment is processed securely. We never store your
                    credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Powered by{" "}
            <span className="font-bold text-slate-500">
              Pay<span className="text-indigo-500">vo</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CheckoutPage;
