import React, { forwardRef } from "react";

export interface OutlinedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The text content to display inside the button */
  text: string;
  /** When true, disables user interaction and applies disabled styles */
  isDisabled?: boolean;
}

/**
 * Modern, accessible OutlinedButton component designed to complement the primary Button.
 * Reuses design tokens from `theme.css` for borders, radius, text, and hover states.
 */
export const OutlinedButton = forwardRef<HTMLButtonElement, OutlinedButtonProps>(
  (
    {
      text,
      isDisabled = false,
      disabled = false,
      type = "button",
      onClick,
      className = "",
      ...rest
    },
    ref,
  ) => {
    const effectiveDisabled = isDisabled || disabled;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (effectiveDisabled) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };

    return (
      <button
        ref={ref}
        type={type}
        disabled={effectiveDisabled}
        aria-disabled={effectiveDisabled}
        onClick={handleClick}
        className={[
          "relative inline-flex items-center justify-center select-none",
          "h-10 px-4 py-2",
          "font-sans text-sm font-medium leading-none tracking-tight",
          "rounded-(--radius) border border-input bg-transparent text-foreground",
          "transition-all duration-200 ease-in-out",
          "hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          effectiveDisabled
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "cursor-pointer active:scale-[0.99] active:bg-accent/90",
          className,
        ].join(" ")}
        {...rest}
      >
        <span className="inline-flex items-center justify-center gap-2">
          {text}
        </span>
      </button>
    );
  },
);

OutlinedButton.displayName = "OutlinedButton";

export default OutlinedButton;
