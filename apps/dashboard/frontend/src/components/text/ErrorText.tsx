import type React from "react";
import { AlertCircle } from "lucide-react";

export interface ErrorTextProps {
  message: string;
  className?: string;
}

export const ErrorText: React.FC<ErrorTextProps> = ({
  message,
  className = "",
}) => {
  return (
    <div
      className={[
        "flex items-center gap-2 px-3 py-2.5 rounded-(--radius)",
        "bg-destructive/10 text-destructive",
        "text-sm font-medium",
        className,
      ].join(" ")}
      role="alert"
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span className="min-w-0 break-words">{message}</span>
    </div>
  );
};

export default ErrorText;
