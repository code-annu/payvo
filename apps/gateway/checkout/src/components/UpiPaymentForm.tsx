import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import upiPaymentSchema, {
  type UpiPaymentFormData,
} from "@/schemas/UpiPaymentSchema";

interface UpiPaymentFormProps {
  onSubmit: (data: UpiPaymentFormData) => void;
  formId: string;
}

export function UpiPaymentForm({ onSubmit, formId }: UpiPaymentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpiPaymentFormData>({
    resolver: zodResolver(upiPaymentSchema),
    defaultValues: {
      upiId: "",
    },
  });

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 animate-[fade-in_0.3s_ease-out]"
    >
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          UPI ID
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="yourname@upi"
            className={`
              w-full px-4 py-3.5 rounded-xl border-2 bg-white text-slate-800
              text-sm font-medium placeholder:text-slate-300
              transition-all duration-200 focus:outline-none focus:ring-0
              ${
                errors.upiId
                  ? "border-red-300 focus:border-red-400"
                  : "border-slate-200 focus:border-indigo-400"
              }
            `}
            {...register("upiId")}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
        </div>
        {errors.upiId && (
          <p className="text-xs text-red-500 mt-0.5">{errors.upiId.message}</p>
        )}
      </div>

      {/* UPI info */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <svg
          className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
          />
        </svg>
        <p className="text-xs text-amber-700 leading-relaxed">
          You'll receive a payment request on your UPI app. Please approve it
          within the time limit to complete the transaction.
        </p>
      </div>
    </form>
  );
}

export default UpiPaymentForm;
