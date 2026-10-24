import React from "react";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export type StatusTagType = "success" | "danger" | "warning";

export interface StatusTagCompProps {
  type: StatusTagType;
  label: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

const typeConfig: Record<
  StatusTagType,
  {
    container: string;
    defaultIcon: React.ReactNode;
  }
> = {
  success: {
    container:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    defaultIcon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />,
  },
  warning: {
    container:
      "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
    defaultIcon: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
  },
  danger: {
    container:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
    defaultIcon: <XCircle className="h-3.5 w-3.5 shrink-0" />,
  },
};

export const StatusTagComp: React.FC<StatusTagCompProps> = ({
  type,
  label,
  icon,
  showIcon = true,
  className = "",
}) => {
  const config = typeConfig[type] ?? typeConfig.success;
  const renderedIcon = icon ?? (showIcon ? config.defaultIcon : null);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold select-none ${config.container} ${className}`}
    >
      {renderedIcon}
      <span>{label}</span>
    </span>
  );
};

export default StatusTagComp;
