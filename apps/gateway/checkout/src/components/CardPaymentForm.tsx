import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import cardPaymentSchema, {
  type CardPaymentFormData,
} from "@/schemas/CardPaymentSchema";

interface CardPaymentFormProps {
  onSubmit: (data: CardPaymentFormData) => void;
  formId: string;
}

export function CardPaymentForm({ onSubmit, formId }: CardPaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CardPaymentFormData>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: {
      cardNumber: "",
      expiryDate: "",
      cvv: "",
      cardholderName: "",
    },
  });

  const cardNumber = watch("cardNumber");

  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const getCardBrand = (number: string) => {
    const clean = number.replace(/\s/g, "");
    if (/^4/.test(clean)) return "Visa";
    if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean)) return "Mastercard";
    if (/^3[47]/.test(clean)) return "Amex";
    if (/^6/.test(clean)) return "Discover";
    return null;
  };

  const brand = getCardBrand(cardNumber || "");

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 animate-[fade-in_0.3s_ease-out]"
    >
      {/* Card Number */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="1234 5678 9012 3456"
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 bg-white text-slate-800
              text-sm font-medium tracking-widest placeholder:text-slate-300
              placeholder:tracking-normal transition-all duration-200
              focus:outline-none focus:ring-0
              ${
                errors.cardNumber
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-indigo-400"
              }
            `}
            {...register("cardNumber", {
              onChange: (e) => {
                const formatted = formatCardNumber(e.target.value);
                setValue("cardNumber", formatted, { shouldValidate: false });
              },
            })}
          />
          {brand && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500 bg-indigo-50 px-2 py-1 rounded-md">
              {brand}
            </span>
          )}
        </div>
        {errors.cardNumber && (
          <p className="text-xs text-red-500 mt-0.5">{errors.cardNumber.message}</p>
        )}
      </div>

      {/* Expiry + CVV Row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Expiry Date
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/YY"
            maxLength={5}
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 bg-white text-slate-800
              text-sm font-medium tracking-wider placeholder:text-slate-300
              transition-all duration-200 focus:outline-none focus:ring-0
              ${
                errors.expiryDate
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-indigo-400"
              }
            `}
            {...register("expiryDate", {
              onChange: (e) => {
                const formatted = formatExpiry(e.target.value);
                setValue("expiryDate", formatted, { shouldValidate: false });
              },
            })}
          />
          {errors.expiryDate && (
            <p className="text-xs text-red-500 mt-0.5">{errors.expiryDate.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            CVV
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="•••"
            maxLength={4}
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 bg-white text-slate-800
              text-sm font-medium tracking-widest placeholder:text-slate-300
              transition-all duration-200 focus:outline-none focus:ring-0
              ${
                errors.cvv
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-indigo-400"
              }
            `}
            {...register("cvv", {
              onChange: (e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                setValue("cvv", digits, { shouldValidate: false });
              },
            })}
          />
          {errors.cvv && (
            <p className="text-xs text-red-500 mt-0.5">{errors.cvv.message}</p>
          )}
        </div>
      </div>

      {/* Cardholder Name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Cardholder Name
        </label>
        <input
          type="text"
          placeholder="John Doe"
          className={`
            w-full px-4 py-3.5 rounded-xl border-2 bg-white text-slate-800
            text-sm font-medium placeholder:text-slate-300
            transition-all duration-200 focus:outline-none focus:ring-0
            ${
              errors.cardholderName
                ? "border-red-300 focus:border-red-400"
                : "border-slate-200 focus:border-indigo-400"
            }
          `}
          {...register("cardholderName")}
        />
        {errors.cardholderName && (
          <p className="text-xs text-red-500 mt-0.5">
            {errors.cardholderName.message}
          </p>
        )}
      </div>
    </form>
  );
}

export default CardPaymentForm;
