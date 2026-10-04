import type { PaymentMethod } from "@/api/payment.types";

interface SelectablePaymentMethodProps {
  methods: PaymentMethod[];
  selectedCode: string;
  onSelect: (code: string) => void;
}

export function SelectablePaymentMethod({
  methods,
  selectedCode,
  onSelect,
}: SelectablePaymentMethodProps) {
  return (
    <div className="flex flex-col gap-3">
      {methods.map((method) => {
        const isSelected = method.code === selectedCode;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onSelect(method.code)}
            className={`
              group relative flex items-center gap-4 px-5 py-4 rounded-2xl
              border-2 transition-all duration-300 cursor-pointer
              ${
                isSelected
                  ? "border-indigo-500 bg-indigo-50/60 shadow-lg shadow-indigo-500/10"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
              }
            `}
          >
            {/* Selection indicator */}
            <div
              className={`
              flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all duration-300
              flex items-center justify-center
              ${
                isSelected
                  ? "border-indigo-500 bg-indigo-500"
                  : "border-slate-300 group-hover:border-slate-400"
              }
            `}
            >
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-white animate-[scale-in_0.2s_ease-out]" />
              )}
            </div>

            {/* Icon */}
            <div
              className={`
              w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden
              transition-all duration-300
              ${
                isSelected
                  ? "bg-white shadow-sm"
                  : "bg-slate-50 group-hover:bg-white"
              }
            `}
            >
              <img
                src={method.iconUrl}
                alt={method.name}
                className="w-8 h-8 object-contain"
              />
            </div>

            {/* Label */}
            <span
              className={`
              text-sm font-semibold tracking-wide transition-colors duration-300
              ${isSelected ? "text-indigo-700" : "text-slate-600 group-hover:text-slate-800"}
            `}
            >
              {method.name}
            </span>

            {/* Active glow */}
            {isSelected && (
              <div className="absolute inset-0 rounded-2xl ring-1 ring-indigo-500/20 pointer-events-none" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default SelectablePaymentMethod;
