import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import netBankingSchema, {
  type NetBankingFormData,
} from "@/schemas/NetBankingSchema";

interface NetBankingPaymentFormProps {
  onSubmit: (data: NetBankingFormData) => void;
  formId: string;
}

const POPULAR_BANKS = [
  { code: "sbi", name: "State Bank of India" },
  { code: "hdfc", name: "HDFC Bank" },
  { code: "icici", name: "ICICI Bank" },
  { code: "axis", name: "Axis Bank" },
  { code: "kotak", name: "Kotak Mahindra Bank" },
  { code: "pnb", name: "Punjab National Bank" },
  { code: "bob", name: "Bank of Baroda" },
  { code: "idbi", name: "IDBI Bank" },
];

export function NetBankingPaymentForm({
  onSubmit,
  formId,
}: NetBankingPaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<NetBankingFormData>({
    resolver: zodResolver(netBankingSchema),
    defaultValues: {
      bankCode: "",
    },
  });

  const selectedBank = watch("bankCode");

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 animate-[fade-in_0.3s_ease-out]"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Select Your Bank
        </label>
        <div className="relative">
          <select
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 bg-white text-slate-800
              text-sm font-medium appearance-none cursor-pointer
              transition-all duration-200 focus:outline-none focus:ring-0
              ${!selectedBank ? "text-slate-300" : ""}
              ${
                errors.bankCode
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-indigo-400"
              }
            `}
            {...register("bankCode")}
          >
            <option value="" disabled>
              Choose a bank
            </option>
            {POPULAR_BANKS.map((bank) => (
              <option key={bank.code} value={bank.code}>
                {bank.name}
              </option>
            ))}
          </select>
          {/* Custom dropdown chevron */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </div>
        </div>
        {errors.bankCode && (
          <p className="text-xs text-red-500 mt-0.5">
            {errors.bankCode.message}
          </p>
        )}
      </div>

      {/* Redirect info */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
        <svg
          className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
          />
        </svg>
        <p className="text-xs text-blue-700 leading-relaxed">
          You'll be redirected to your bank's secure login page to complete the
          payment.
        </p>
      </div>
    </form>
  );
}

export default NetBankingPaymentForm;
