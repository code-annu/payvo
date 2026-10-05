import AmountUtil from "@/core/util/amount.util";

interface ProcessingPaymentCompProps {
  orderNumber?: string | number;
  orderId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
}

export function ProcessingPaymentComp({
  orderNumber,
  orderId,
  amount,
  currency,
  paymentMethod,
}: ProcessingPaymentCompProps) {
  const displayId =
    orderNumber !== undefined
      ? String(orderNumber)
      : orderId
        ? `${orderId.slice(0, 8)}…`
        : "";
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-500/10 border border-indigo-100 p-8 text-center">
          {/* Animated Spinner with Lock Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            {/* Outer spinning ring */}
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />

            {/* Inner pulse */}
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center animate-pulse">
              <svg
                className="w-6 h-6 text-indigo-600"
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
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Processing Payment
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Please wait while we securely process your transaction. Do not refresh
            or close this window.
          </p>

          {/* Details Card if order info is available */}
          {(amount !== undefined && currency || orderId || paymentMethod) && (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3 mb-6 text-left">
              {amount !== undefined && currency && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Total Amount
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    {AmountUtil.formatAmount(amount, currency)}
                  </span>
                </div>
              )}

              {paymentMethod && (
                <>
                  <div className="h-px bg-slate-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Payment Method
                    </span>
                    <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                      {paymentMethod.replace("_", " ")}
                    </span>
                  </div>
                </>
              )}

              {(orderNumber !== undefined || orderId) && (
                <>
                  <div className="h-px bg-slate-100" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Order ID
                    </span>
                    <span className="text-xs text-slate-600 font-semibold font-mono">
                      {displayId}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Subtle live indicator badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/70 border border-indigo-100">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
            <span className="text-xs font-medium text-indigo-700">
              Verifying with payment network…
            </span>
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

export default ProcessingPaymentComp;
