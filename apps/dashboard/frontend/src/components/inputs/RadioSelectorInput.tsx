import React from "react";

export interface RadioSelectorInputProps {
  /** Main title displayed for the option */
  title: React.ReactNode;
  /** Optional description/content displayed below the title */
  content?: React.ReactNode | undefined;
  /** Whether this radio option is currently selected */
  isSelected?: boolean | undefined;
  /** Alternative alias for isSelected */
  selected?: boolean | undefined;
  /** Callback triggered when the radio item is selected */
  onSelect?: (() => void) | undefined;
  /** Alternative alias for onSelect */
  onClick?: (() => void) | undefined;
  /** Optional badge/tag rendered next to the title */
  badge?: React.ReactNode | undefined;
  /** Optional leading icon */
  icon?: React.ReactNode | undefined;
  /** Whether the radio item is disabled */
  disabled?: boolean | undefined;
  /** Additional container classes */
  className?: string | undefined;
  /** Optional children rendered below content */
  children?: React.ReactNode | undefined;
  /** Optional radio value identifier */
  value?: string | undefined;
  /** Optional name attribute for group identification */
  name?: string | undefined;
}

export const RadioSelectorInput: React.FC<RadioSelectorInputProps> = ({
  title,
  content,
  isSelected: explicitIsSelected,
  selected: explicitSelected,
  onSelect,
  onClick,
  badge,
  icon,
  disabled = false,
  className = "",
  children,
}) => {
  const isSelected = explicitIsSelected ?? explicitSelected ?? false;

  const handleClick = () => {
    if (disabled) return;
    onSelect?.();
    onClick?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="radio"
      aria-checked={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-all select-none",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-muted/30",
        disabled ? "opacity-60 cursor-not-allowed pointer-events-none" : "",
        className,
      ].join(" ")}
    >
      {/* Radio Circle Indicator */}
      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-primary/50 text-primary">
        {isSelected && <span className="h-2 w-2 rounded-full bg-primary" />}
      </div>

      {/* Leading icon if provided */}
      {icon && <div className="mt-0.5 shrink-0 text-foreground">{icon}</div>}

      {/* Text Body */}
      <div className="flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-foreground">{title}</span>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>

        {content && (
          <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {content}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default RadioSelectorInput;
