import React, { forwardRef, useId } from "react";

export interface TextInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  /** Label text displayed above the input */
  label?: string;
  /** Placeholder text displayed inside the input when empty */
  placeholder?: string;
  /** Explanatory or validation helper text displayed below the input */
  helperText?: string;
  /** When true or a non-empty string, triggers error styling and displays error message */
  error?: boolean | string;
  /** Alias for disabled */
  isDisabled?: boolean;
  /** Optional icon or element displayed at the start of the input */
  startAdornment?: React.ReactNode;
  /** Optional icon or element displayed at the end of the input */
  endAdornment?: React.ReactNode;
  /** Optional class name to customize the input container */
  containerClassName?: string;
}

/**
 * Reusable, accessible, and polished TextInput component inspired by modern form field designs.
 * Supports controlled/uncontrolled usage, full accessibility linking, helper text, and theme tokens.
 */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      placeholder,
      helperText,
      error = false,
      isDisabled = false,
      disabled = false,
      required = false,
      id,
      name,
      type = "text",
      value,
      defaultValue,
      onChange,
      startAdornment,
      endAdornment,
      containerClassName = "",
      className = "",
      ...rest
    },
    ref,
  ) => {
    const fallbackId = useId();
    const inputId = id || fallbackId;
    const helperTextId = `${inputId}-helper`;

    const hasError = Boolean(error);
    const displayedHelperText =
      typeof error === "string" && error.length > 0 ? error : helperText;
    const effectiveDisabled = isDisabled || disabled;

    return (
      <div className={["w-full flex flex-col gap-1.5", containerClassName].join(" ")}>
        {/* Accessible Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={[
              "text-xs font-semibold tracking-wide flex items-center gap-1 select-none",
              hasError ? "text-destructive" : "text-foreground",
              effectiveDisabled
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer",
            ].join(" ")}
          >
            <span>{label}</span>
            {required && (
              <span
                className="text-destructive font-bold leading-none"
                aria-hidden="true"
              >
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container */}
        <div
          className={[
            "relative flex items-center w-full rounded-[var(--radius)] border bg-background text-foreground",
            "transition-all duration-200 ease-in-out",
            hasError
              ? "border-destructive text-destructive focus-within:border-destructive focus-within:ring-2 focus-within:ring-destructive/20 focus-within:ring-offset-1 focus-within:ring-offset-background"
              : "border-input hover:border-ring/50 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 focus-within:ring-offset-1 focus-within:ring-offset-background",
            effectiveDisabled ? "opacity-50 bg-muted/40 cursor-not-allowed" : "",
          ].join(" ")}
        >
          {startAdornment && (
            <span className="pl-3 flex items-center justify-center text-muted-foreground select-none pointer-events-none">
              {startAdornment}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            defaultValue={defaultValue}
            onChange={onChange}
            placeholder={placeholder}
            disabled={effectiveDisabled}
            required={required}
            aria-invalid={hasError}
            aria-describedby={displayedHelperText ? helperTextId : undefined}
            className={[
              "w-full h-10 bg-transparent text-sm text-foreground",
              "placeholder:text-muted-foreground/60 placeholder:font-normal",
              "focus:outline-none",
              startAdornment ? "pl-2" : "pl-3.5",
              endAdornment ? "pr-2" : "pr-3.5",
              "py-2 font-sans",
              effectiveDisabled ? "cursor-not-allowed text-muted-foreground" : "",
              className,
            ].join(" ")}
            {...rest}
          />

          {endAdornment && (
            <span className="pr-3 flex items-center justify-center text-muted-foreground">
              {endAdornment}
            </span>
          )}
        </div>

        {/* Helper or Error Text */}
        {displayedHelperText && (
          <p
            id={helperTextId}
            role={hasError ? "alert" : undefined}
            className={[
              "text-xs transition-colors duration-150 select-none",
              hasError
                ? "text-destructive font-medium"
                : "text-muted-foreground",
            ].join(" ")}
          >
            {displayedHelperText}
          </p>
        )}
      </div>
    );
  },
);

TextInput.displayName = "TextInput";

export const TextInputField = TextInput;
export default TextInput;
export type TextInputFieldProps = TextInputProps;
