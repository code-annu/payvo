import React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import type { TransactionItem } from "../api/transaction.types";
import CurrencyUtil from "@/core/util/currency.util";
import DateTimeUtil from "@/core/util/date-time.util";

export interface TransactionInfoCompProps {
  transaction: TransactionItem;
  onSelect?: (transaction: TransactionItem) => void;
}

export const TransactionInfoComp: React.FC<TransactionInfoCompProps> = ({
  transaction,
  onSelect,
}) => {
  const isPayin = transaction.paymentType === "PAYIN";
  const currency = transaction.currency || "INR";

  const formattedDate = DateTimeUtil.formatDateShort(transaction.createdAt);
  const formattedNetAmount = CurrencyUtil.formatPaise(
    transaction.netAmount,
    currency,
  );
  const formattedGrossAmount = CurrencyUtil.formatPaise(
    transaction.grossAmount,
    currency,
  );
  const formattedFeeAmount = CurrencyUtil.formatPaise(
    transaction.feeAmount,
    currency,
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(transaction)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(transaction);
        }
      }}
      className={[
        "group relative bg-card text-card-foreground border border-border",
        "rounded-[calc(var(--radius)+4px)] p-4 sm:p-5",
        "transition-all duration-200 shadow-xs hover:border-primary/40 hover:shadow-md",
        "flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer",
      ].join(" ")}
    >
      {/* ── Left: Icon, Badge & Date ── */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0">
        <div
          className={[
            "w-10 h-10 rounded-(--radius) flex items-center justify-center shrink-0 transition-colors",
            isPayin
              ? "bg-success/10 text-success group-hover:bg-success/15"
              : "bg-warning/10 text-warning group-hover:bg-warning/15",
          ].join(" ")}
        >
          {isPayin ? (
            <ArrowDownLeft className="w-5 h-5" />
          ) : (
            <ArrowUpRight className="w-5 h-5" />
          )}
        </div>

        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={[
                "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wide uppercase",
                isPayin
                  ? "bg-success/15 text-success border border-success/30"
                  : "bg-warning/15 text-warning border border-warning/30",
              ].join(" ")}
            >
              {transaction.paymentType}
            </span>
          </div>

          <p className="text-xs text-muted-foreground">{formattedDate}</p>
        </div>
      </div>

      {/* ── Right: Amounts & View Details Chevron ── */}
      <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
        <div className="flex flex-col sm:items-end">
          <span
            className={[
              "text-base font-bold tracking-tight font-mono",
              isPayin ? "text-foreground" : "text-warning",
            ].join(" ")}
          >
            {isPayin ? "+" : "-"}
            {formattedNetAmount}
          </span>
          <span className="text-[11px] text-muted-foreground font-mono">
            Gross: {formattedGrossAmount} • Fee: {formattedFeeAmount}
          </span>
        </div>

        <div className="p-1.5 rounded-(--radius) text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

export default TransactionInfoComp;
