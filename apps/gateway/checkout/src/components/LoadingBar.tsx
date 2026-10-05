interface LoadingBarProps {
  message?: string;
}

export function LoadingBar({ message = "Loading checkout…" }: LoadingBarProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-violet-50/20 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          {message}
        </p>
      </div>
    </div>
  );
}

export default LoadingBar;
