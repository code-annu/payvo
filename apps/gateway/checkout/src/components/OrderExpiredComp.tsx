interface OrderExpiredCompProps {
  orderNumber?: string | number;
  orderId?: string;
}

export function OrderExpiredComp({ orderNumber, orderId }: OrderExpiredCompProps) {
  const displayId =
    orderNumber !== undefined
      ? String(orderNumber)
      : orderId
        ? `${orderId.slice(0, 8)}…`
        : "";
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-orange-500/5 border border-orange-100 p-8 text-center">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Payment Link Expired
          </h2>

          {/* Description */}
          <p className="text-sm text-slate-500 leading-relaxed mb-6">
            This payment session has expired. Please request a new payment link
            from the merchant to complete your transaction.
          </p>

          {/* Order ID badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Order ID</span>
            <span className="text-xs text-slate-600 font-semibold font-mono">
              {displayId}
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

export default OrderExpiredComp;
