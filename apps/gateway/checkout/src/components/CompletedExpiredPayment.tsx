import AmountUtil from "@/core/util/amount.util";

interface CompletedExpiredPaymentProps {
  orderNumber?: string | number;
  orderId?: string;
  amount: number;
  currency: string;
}

export function CompletedExpiredPayment({
  orderNumber,
  orderId,
  amount,
  currency,
}: CompletedExpiredPaymentProps) {
  const displayId =
    orderNumber !== undefined
      ? String(orderNumber)
      : orderId
        ? `${orderId.slice(0, 8)}…`
        : "";
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-amber-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-300/30 border border-slate-100 p-8 text-center">
          {/* Badge Icon */}
          <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-scale-in">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            {/* Small amber clock badge on corner */}
            <div
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-100 border-2 border-white rounded-full flex items-center justify-center shadow-sm"
              title="Session Expired"
            >
              <svg
                className="w-4 h-4 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Payment Completed
          </h2>

          {/* Expiry note badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Session Expired
          </div>

          {/* Description */}
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            This order was successfully paid. However, the payment session has
            expired and no further actions can be taken on this link.
          </p>

          {/* Payment details */}
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Amount Paid
              </span>
              <span className="text-sm font-bold text-emerald-600">
                {AmountUtil.formatAmount(amount, currency)}
              </span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Order ID
              </span>
              <span className="text-xs text-slate-600 font-semibold font-mono">
                {displayId}
              </span>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Payment Status
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Successful
              </span>
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

export default CompletedExpiredPayment;
