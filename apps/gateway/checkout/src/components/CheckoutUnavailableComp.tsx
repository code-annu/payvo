interface CheckoutUnavailableCompProps {
  message?: string;
}

export function CheckoutUnavailableComp({ message }: CheckoutUnavailableCompProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-red-500/5 border border-red-100 p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-slate-800 mb-2">
          Checkout Unavailable
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed">
          {message || "Unable to load checkout details. The link may be invalid or expired."}
        </p>
      </div>
    </div>
  );
}

export default CheckoutUnavailableComp;
