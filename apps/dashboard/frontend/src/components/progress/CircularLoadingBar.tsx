import type React from "react";

export interface CircularLoadingBarProps {
  /** Diameter in px. Defaults to 40. */
  size?: number;
  /** Stroke width in px. Defaults to 3.5. */
  strokeWidth?: number;
  /** Custom stroke color (defaults to var(--primary)). */
  color?: string;
  /** Custom background track color (defaults to var(--border) with subtle opacity). */
  trackColor?: string;
  /** Optional CSS class for the wrapper. */
  className?: string;
  /** Accessible label for screen readers. Defaults to "Loading...". */
  label?: string;
}

/**
 * Modern circular loading spinner that adheres to the PayO design system.
 * Uses `var(--primary)` and `var(--border)` with smooth CSS keyframe animation.
 */
export const CircularLoadingBar: React.FC<CircularLoadingBarProps> = ({
  size = 40,
  strokeWidth = 3.5,
  color = "var(--primary)",
  trackColor,
  className = "",
  label = "Loading...",
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  return (
    <div
      className={`inline-flex items-center justify-center ${className}`}
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        style={{ animation: "cl-rotate 1.4s linear infinite" }}
      >
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor || "var(--border)"}
          strokeWidth={strokeWidth}
          opacity={trackColor ? 1 : 0.4}
        />

        {/* Dynamic animated arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.7}
          style={{
            transformOrigin: "center",
            animation: "cl-dash 1.4s ease-in-out infinite",
          }}
        />
      </svg>

      <style>{`
        @keyframes cl-rotate {
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes cl-dash {
          0% {
            stroke-dashoffset: ${circumference * 0.85};
            transform: rotate(0deg);
          }
          50% {
            stroke-dashoffset: ${circumference * 0.25};
            transform: rotate(135deg);
          }
          100% {
            stroke-dashoffset: ${circumference * 0.85};
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default CircularLoadingBar;
