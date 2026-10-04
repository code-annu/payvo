import { useState } from "react";
import { useGetCheckoutOrder } from "@/hooks/useGetCheckoutOrder";
import { SelectablePaymentMethod } from "@/components/SelectablePaymentMethod";
import { CardPaymentForm } from "@/components/CardPaymentForm";
import { UpiPaymentForm } from "@/components/UpiPaymentForm";
import { NetBankingPaymentForm } from "@/components/NetBankingPaymentForm";
import { ConfirmPaymentButton } from "@/components/ConfirmPaymentButton";
import type { CardPaymentFormData } from "@/schemas/CardPaymentSchema";
import type { UpiPaymentFormData } from "@/schemas/UpiPaymentSchema";
import type { NetBankingFormData } from "@/schemas/NetBankingSchema";

const PAYMENT_FORM_ID = "payment-form";

export function CheckoutPage() {
  // Extract CSI from URL search params
  const csi = new URLSearchParams(window.location.search).get("csi") ?? "";
  const { data, isLoading, error } = useGetCheckoutOrder(csi);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  // Auto-select first method when data loads
  if (data && !selectedMethod && data.paymentMethods.length > 0) {
    setSelectedMethod(data.paymentMethods[0].code);
  }

  const handleFormSubmit = (
    formData: CardPaymentFormData | UpiPaymentFormData | NetBankingFormData
  ) => {
    console.log("Payment Method:", selectedMethod);
    console.log("Form Data:", formData);
    console.log("Payment Order ID:", data?.paymentOrder.id);
    console.log("Amount:", data?.paymentOrder.amount);
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatExpiry = (isoDate: string) => {
    const d = new Date(isoDate);
    const minutes = Math.max(
      0,
      Math.floor((d.getTime() - Date.now()) / 60000)
    );
    if (minutes < 1) return "Expired";
    if (minutes < 60) return `${minutes}m remaining`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m remaining`;
  };

  // ─── Loading State ───
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">
            Loading checkout…
          </p>
        </div>
      </div>
    );
  }

  // ─── Error State ───
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-red-500/5 border border-red-100 p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">
            Checkout Unavailable
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            {error?.message || "Unable to load checkout details. The link may be invalid or expired."}
          </p>
        </div>
      </div>
    );
  }

  const { paymentOrder, paymentMethods } = data;

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
                  {formatAmount(paymentOrder.amount, paymentOrder.currency)}
                </p>
              </div>
            </div>
          </div>

          {/* ─── Order Details Strip ─── */}
          <div className="px-6 sm:px-8 py-4 bg-slate-50/80 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Order ID</span>
                <span className="text-slate-600 font-semibold font-mono">
                  {paymentOrder.id.slice(0, 8)}…
                </span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Currency</span>
                <span className="text-slate-600 font-semibold">
                  {paymentOrder.currency}
                </span>
              </div>
              <div className="w-px h-4 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    formatExpiry(paymentOrder.expiresAt) === "Expired"
                      ? "bg-red-100 text-red-600"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      formatExpiry(paymentOrder.expiresAt) === "Expired"
                        ? "bg-red-500"
                        : "bg-emerald-500 animate-pulse"
                    }`}
                  />
                  {formatExpiry(paymentOrder.expiresAt)}
                </span>
              </div>
            </div>
          </div>

          {/* ─── Body: Payment Methods + Form ─── */}
          <div className="px-6 sm:px-8 py-8">
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
