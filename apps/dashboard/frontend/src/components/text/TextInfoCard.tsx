import type { LucideIcon } from "lucide-react";

type TextInfoCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  helper?: string;
  disabled?: boolean;
};

export default function TextInfoCard({
  icon: Icon,
  label,
  value,
  helper,
  disabled = false,
}: TextInfoCardProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-foreground">{label}</p>
      <div
        className={`flex h-11 w-full min-w-0 items-center gap-2.5 rounded-lg border border-input px-3 ${disabled ? "bg-muted/40 text-muted-foreground" : "bg-background text-foreground"}`}
      >
        <Icon
          size={16}
          className="shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <span className="min-w-0 truncate text-sm">{value}</span>
      </div>
      {helper && (
        <p className="mt-1.5 text-xs text-muted-foreground">{helper}</p>
      )}
    </div>
  );
}
