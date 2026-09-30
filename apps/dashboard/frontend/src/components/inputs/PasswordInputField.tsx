import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { TextInput, type TextInputProps } from "./TextInputField";

export type PasswordInputProps = Omit<TextInputProps, "type" | "endAdornment">;

/**
 * Reusable, accessible PasswordInput component with visibility toggle.
 * Uses Lucide icons (Eye, EyeOff) and integrates directly with TextInput and the PayO theme.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ isDisabled = false, disabled = false, ...rest }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const effectiveDisabled = isDisabled || disabled;

    const togglePasswordVisibility = () => {
      if (effectiveDisabled) return;
      setShowPassword((prev) => !prev);
    };

    const eyeButtonLabel = showPassword ? "Hide password" : "Show password";

    const visibilityToggle = (
      <button
        type="button"
        onClick={togglePasswordVisibility}
        onMouseDown={(e) => {
          // Prevent button click from causing the input to lose focus
          e.preventDefault();
        }}
        disabled={effectiveDisabled}
        aria-label={eyeButtonLabel}
        aria-pressed={showPassword}
        title={eyeButtonLabel}
        className={[
          "inline-flex items-center justify-center p-1 rounded-[calc(var(--radius)-4px)] select-none",
          "text-muted-foreground hover:text-foreground hover:bg-muted/80",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "transition-colors duration-150",
          effectiveDisabled
            ? "opacity-40 cursor-not-allowed pointer-events-none"
            : "cursor-pointer",
        ].join(" ")}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </button>
    );

    return (
      <TextInput
        ref={ref}
        type={showPassword ? "text" : "password"}
        endAdornment={visibilityToggle}
        disabled={disabled}
        isDisabled={isDisabled}
        {...rest}
      />
    );
  },
);

PasswordInput.displayName = "PasswordInput";

export const PasswordInputField = PasswordInput;
export default PasswordInput;
export type PasswordInputFieldProps = PasswordInputProps;
