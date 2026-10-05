import AmountUtil from "@/core/util/amount.util";

interface OrderCompletedCompProps {
  orderNumber?: string | number;
  orderId?: string;
  amount: number;
  currency: string;
}

export function OrderCompletedComp({
  orderNumber,
  orderId,
  amount,
  currency,
}: OrderCompletedCompProps) {
  const displayId =
    orderNumber !== undefined
      ? String(orderNumber)
      : orderId
        ? `${orderId.slice(0, 8)}…`
        : "";
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-emerald-500/5 border border-emerald-100 p-8 text-center">
          {/* Animated checkmark */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center animate-scale-in shadow-lg shadow-emerald-500/25">
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

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Payment Successful
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            Your payment has been processed successfully. You will receive a
            confirmation shortly.
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

export default OrderCompletedComp;
