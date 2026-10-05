import { useState, useEffect, useRef, useCallback } from "react";
import DateTimeUtil from "@/core/util/date-time.util";

interface ExpiryTimerCompProps {
  /** ISO date string or Date object for when the order expires */
  expiresAt: string | Date;
  /** Called once when the timer reaches zero */
  onExpire?: () => void;
}

export function ExpiryTimerComp({ expiresAt, onExpire }: ExpiryTimerCompProps) {
  const [remaining, setRemaining] = useState(() =>
    DateTimeUtil.getRemainingSeconds(expiresAt),
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasExpiredRef = useRef(false);

  const tick = useCallback(() => {
    const secs = DateTimeUtil.getRemainingSeconds(expiresAt);
    setRemaining(secs);

    if (secs <= 0 && !hasExpiredRef.current) {
      hasExpiredRef.current = true;
      onExpire?.();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [expiresAt, onExpire]);

  useEffect(() => {
    // Initial check
    tick();

    // Don't start interval if already expired
    if (DateTimeUtil.isExpired(expiresAt)) {
      return;
    }

    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tick, expiresAt]);

  const isUrgent = remaining > 0 && remaining <= 120; // last 2 minutes
  const isExpired = remaining <= 0;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold transition-colors duration-300 ${
          isExpired
            ? "bg-red-100 text-red-600"
            : isUrgent
              ? "bg-amber-100 text-amber-700"
              : "bg-emerald-100 text-emerald-700"
        }`}
      >
        {/* Pulsing dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isExpired
              ? "bg-red-500"
              : isUrgent
                ? "bg-amber-500 animate-pulse"
                : "bg-emerald-500 animate-pulse"
          }`}
        />

        {isExpired ? (
          "Expired"
        ) : (
          <>
            {/* Clock icon */}
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
            {DateTimeUtil.formatCountdown(remaining)}
          </>
        )}
      </span>
    </div>
  );
}

export default ExpiryTimerComp;
