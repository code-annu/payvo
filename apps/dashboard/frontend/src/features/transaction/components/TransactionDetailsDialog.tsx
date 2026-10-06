import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Receipt,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  CreditCard,
  Clock,
} from "lucide-react";
import { useGetTransactionDetails } from "../hooks/useGetTransactionDetails";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import CopyableField from "@/components/inputs/CopyableField";
import { Button } from "@/components/buttons/CustomButton";
import CurrencyUtil from "@/core/util/currency.util";
import DateTimeUtil from "@/core/util/date-time.util";

export interface TransactionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactionId: string | null;
}

export const TransactionDetailsDialog: React.FC<
  TransactionDetailsDialogProps
> = ({ isOpen, onClose, transactionId }) => {
  const {
    data: transaction,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTransactionDetails(transactionId, isOpen);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPayin = transaction?.paymentType === "PAYIN";
  const currency = transaction?.currency || "INR";
  const paymentMethod =
    transaction?.paymentAttempt?.paymentMethod ?? transaction?.paymentMethod;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="presentation"
    >
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Dialog Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-details-dialog-title"
        className={[
          "relative z-10 w-full max-w-xl max-h-[90vh] overflow-y-auto",
          "bg-card text-card-foreground border border-border",
          "rounded-[calc(var(--radius)+4px)] shadow-2xl p-6 sm:p-7",
          "flex flex-col gap-6",
        ].join(" ")}
      >
        {/* ── Dialog Header ── */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={[
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                isPayin
                  ? "bg-success/15 text-success"
                  : "bg-warning/15 text-warning",
              ].join(" ")}
            >
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2
                  id="transaction-details-dialog-title"
                  className="text-lg font-bold text-foreground"
                >
                  Transaction Details
                </h2>
                {transaction && (
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
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Settlement breakdown and payment records
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-(--radius) text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ── Body ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CircularLoadingBar size={36} strokeWidth={3.5} />
            <p className="text-xs text-muted-foreground">
              Loading transaction details...
            </p>
          </div>
        ) : isError ? (
          <div className="p-6 bg-destructive/5 border border-destructive/20 rounded-(--radius) flex flex-col items-center justify-center text-center gap-3">
            <AlertCircle className="w-6 h-6 text-destructive" />
            <p className="text-xs text-muted-foreground max-w-xs">
              {error instanceof Error
                ? error.message
                : "Failed to retrieve transaction details."}
            </p>
            <Button
              text="Try Again"
              color="secondary"
              onClick={() => refetch()}
              className="text-xs h-8 px-4"
            />
          </div>
        ) : transaction ? (
          <div className="flex flex-col gap-6">
            {/* Financial Overview Card */}
            <div className="bg-muted/30 border border-input rounded-(--radius) p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Net Settlement
                </span>
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-background border border-input text-foreground">
                  {currency}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span
                  className={[
                    "text-3xl font-extrabold tracking-tight font-mono",
                    isPayin ? "text-foreground" : "text-warning",
                  ].join(" ")}
                >
                  {isPayin ? "+" : "-"}
                  {CurrencyUtil.formatPaise(transaction.netAmount, currency)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/60">
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Gross Amount
                  </span>
                  <span className="text-sm font-semibold font-mono text-foreground">
                    {CurrencyUtil.formatPaise(
                      transaction.grossAmount,
                      currency,
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block">
                    Fee Amount
                  </span>
                  <span className="text-sm font-semibold font-mono text-muted-foreground">
                    {CurrencyUtil.formatPaise(transaction.feeAmount, currency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Details */}
            {paymentMethod && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Payment Method
                  </h3>
                </div>

                <div className="bg-muted/20 border border-border/70 rounded-(--radius) p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-(--radius) bg-primary/10 text-primary flex items-center justify-center shrink-0 overflow-hidden">
                      {paymentMethod.iconUrl ? (
                        <img
                          src={paymentMethod.iconUrl}
                          alt={paymentMethod.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            // Fallback to CreditCard icon if image fails
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {paymentMethod.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted border border-input text-muted-foreground uppercase">
                          {paymentMethod.code}
                        </span>
                        {transaction.paymentAttempt && (
                          <span className="text-[11px] text-muted-foreground">
                            Attempt #{transaction.paymentAttempt.attemptNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {transaction.paymentAttempt && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/15 text-success border border-success/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {transaction.paymentAttempt.status}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Payment Order Details */}
            {transaction.paymentOrder && (
              <div className="flex flex-col gap-3 pt-2 border-t border-border/60">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Order Details
                  </h3>
                </div>

                <CopyableField
                  label="Order Number"
                  value={transaction.paymentOrder.orderNumber}
                  copyTooltip="Copy order number"
                  copySuccessMessage="Order number copied!"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/20 border border-border/70 rounded-(--radius) p-3">
                    <span className="text-[11px] text-muted-foreground block">
                      Order Status
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {transaction.paymentOrder.status}
                    </span>
                  </div>

                  <div className="bg-muted/20 border border-border/70 rounded-(--radius) p-3">
                    <span className="text-[11px] text-muted-foreground block">
                      Order Amount
                    </span>
                    <span className="text-xs font-semibold font-mono text-foreground mt-1 block">
                      {CurrencyUtil.formatPaise(
                        transaction.paymentOrder.amount,
                        transaction.paymentOrder.currency || currency,
                      )}
                    </span>
                  </div>
                </div>

                {transaction.paymentOrder.completedAt && (
                  <div className="bg-muted/20 border border-border/70 rounded-(--radius) p-3">
                    <span className="text-[11px] text-muted-foreground block">
                      Order Completed At
                    </span>
                    <span className="text-xs font-medium text-foreground mt-0.5 block">
                      {DateTimeUtil.formatDateTime(
                        transaction.paymentOrder.completedAt,
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Timestamps */}
            <div className="flex flex-col gap-2 pt-2 border-t border-border/60">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-semibold">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>Timeline</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-muted/20 border border-border/70 rounded-(--radius) p-3">
                  <span className="text-[11px] text-muted-foreground block">
                    Created At
                  </span>
                  <span className="text-xs font-medium text-foreground mt-0.5 block">
                    {DateTimeUtil.formatDateTime(transaction.createdAt)}
                  </span>
                </div>
                <div className="bg-muted/20 border border-border/70 rounded-(--radius) p-3">
                  <span className="text-[11px] text-muted-foreground block">
                    Last Updated
                  </span>
                  <span className="text-xs font-medium text-foreground mt-0.5 block">
                    {DateTimeUtil.formatDateTime(transaction.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Dialog Footer ── */}
        <div className="flex justify-end pt-2 border-t border-border/60">
          <Button
            text="Close"
            color="secondary"
            onClick={onClose}
            className="text-xs h-9 px-5"
          />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TransactionDetailsDialog;
