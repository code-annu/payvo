import AmountUtil from "@/core/util/amount.util";

interface ConfirmPaymentButtonProps {
  formId: string;
  amount: number;
  currency: string;
}

export function ConfirmPaymentButton({
  formId,
  amount,
  currency,
}: ConfirmPaymentButtonProps) {
  return (
    <button
      type="submit"
      form={formId}
      className="
        group relative w-full py-4 px-6 rounded-2xl
        bg-gradient-to-r from-indigo-600 to-violet-600
        hover:from-indigo-500 hover:to-violet-500
        active:from-indigo-700 active:to-violet-700
        text-white font-semibold text-sm tracking-wide
        shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30
        transition-all duration-300 ease-out
        cursor-pointer
        overflow-hidden
      "
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <span className="relative flex items-center justify-center gap-2">
        <svg
          className="w-5 h-5"
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
        Pay {AmountUtil.formatAmount(amount, currency)}
      </span>
    </button>
  );
}

export default ConfirmPaymentButton;
