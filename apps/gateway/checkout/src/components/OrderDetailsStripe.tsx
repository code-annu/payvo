import { ExpiryTimerComp } from "@/components/ExpiryTimerComp";

interface OrderDetailsStripeProps {
  orderNumber?: string | number;
  orderId?: string;
  currency: string;
  expiresAt: string | Date;
  onExpire?: () => void;
}

export function OrderDetailsStripe({
  orderNumber,
  orderId,
  currency,
  expiresAt,
  onExpire,
}: OrderDetailsStripeProps) {
  const displayId =
    orderNumber !== undefined
      ? String(orderNumber)
      : orderId
        ? `${orderId.slice(0, 8)}…`
        : "";

  return (
    <div className="px-6 sm:px-8 py-4 bg-slate-50/80 border-b border-slate-100">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Order ID</span>
          <span className="text-slate-600 font-semibold font-mono">
            {displayId}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-medium">Currency</span>
          <span className="text-slate-600 font-semibold">
            {currency}
          </span>
        </div>
        <div className="w-px h-4 bg-slate-200" />
        <ExpiryTimerComp
          expiresAt={expiresAt}
          onExpire={onExpire}
        />
      </div>
    </div>
  );
}

export default OrderDetailsStripe;
