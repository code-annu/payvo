import React, { forwardRef } from "react";

export type ButtonColor =
  | "primary"
  | "secondary"
  | "destructive"
  | "accent"
  | "success"
  | "muted";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** The text content to display inside the button */
  text: string;
  /** Semantic color scheme of the button. Defaults to 'primary' */
  color?: ButtonColor;
  /** When true, displays a loading spinner and disables user interaction */
  isLoading?: boolean;
  /** When true, disables user interaction and applies disabled styles */
  isDisabled?: boolean;
}

const colorStyles: Record<ButtonColor, string> = {
  primary:
    "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 shadow-sm shadow-primary/20",
  secondary:
    "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/90 shadow-sm",
  destructive:
    "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 shadow-sm shadow-destructive/20",
  accent:
    "bg-accent text-accent-foreground hover:bg-accent/80 active:bg-accent/90 shadow-sm",
  success:
    "bg-success text-success-foreground hover:bg-success/90 active:bg-success/95 shadow-sm shadow-success/20",
  muted:
    "bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted/90",
};

/**
 * Modern, accessible, reusable Button component styled with PayO design system tokens.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      text,
      color = "primary",
      isLoading = false,
      isDisabled = false,
      disabled = false,
      type = "button",
      onClick,
      className = "",
      ...rest
    },
    ref,
  ) => {
    const effectiveDisabled = isDisabled || isLoading || disabled;

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
        aria-busy={isLoading}
        onClick={handleClick}
        className={[
          "relative inline-flex items-center justify-center",
          "h-10 px-4 py-2 select-none",
          "font-sans text-sm font-medium leading-none tracking-tight",
          "rounded-(--radius) transition-all duration-200 ease-in-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          colorStyles[color] || colorStyles.primary,
          effectiveDisabled
            ? "opacity-50 cursor-not-allowed pointer-events-none"
            : "cursor-pointer active:scale-[0.99]",
          className,
        ].join(" ")}
        {...rest}
      >
        {/* Loading Spinner overlay to keep dimensions stable */}
        {isLoading && (
          <span
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            aria-hidden="true"
          >
            <svg
              className="animate-spin h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3.5"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span className="sr-only">Loading...</span>
          </span>
        )}

        {/* Text node: preserved in DOM while loading so button dimensions never shift */}
        <span
          className={
            isLoading
              ? "invisible opacity-0"
              : "inline-flex items-center justify-center gap-2"
          }
          aria-hidden={isLoading ? "true" : undefined}
        >
          {text}
        </span>
      </button>
    );
  },
);

Button.displayName = "Button";

export const CustomButton = Button;
export default Button;
export type CustomButtonProps = ButtonProps;
