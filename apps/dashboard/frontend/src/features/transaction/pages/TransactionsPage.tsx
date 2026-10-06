import React, { useState, useMemo } from "react";
import {
  RotateCcw,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Wallet,
} from "lucide-react";
import { useGetMerchantTransactions } from "../hooks/useGetMerchantTransactions";
import type { TransactionItem, PaymentType } from "../api/transaction.types";
import TransactionInfoComp from "../components/TransactionInfoComp";
import TransactionDetailsDialog from "../components/TransactionDetailsDialog";
import NoTransactionsComp from "../components/NoTransactionsComp";
import CircularLoadingBar from "@/components/progress/CircularLoadingBar";
import { Button } from "@/components/buttons/CustomButton";
import CurrencyUtil from "@/core/util/currency.util";

export const TransactionsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } =
    useGetMerchantTransactions();

  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);
  const [filterType, setFilterType] = useState<"ALL" | PaymentType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const rawTransactions = useMemo(
    () => data?.transactions ?? [],
    [data?.transactions],
  );

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return rawTransactions.filter((tx) => {
      const matchesType =
        filterType === "ALL" || tx.paymentType === filterType;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        tx.id.toLowerCase().includes(q) ||
        tx.paymentOrderId.toLowerCase().includes(q) ||
        tx.currency.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [rawTransactions, filterType, searchQuery]);

  // Aggregate metrics
  const metrics = useMemo(() => {
    let netTotalPaise = 0;
    let payinCount = 0;
    let refundCount = 0;
    const currency = rawTransactions[0]?.currency || "INR";

    for (const tx of rawTransactions) {
      const net = Number(tx.netAmount) || 0;
      if (tx.paymentType === "PAYIN") {
        netTotalPaise += net;
        payinCount++;
      } else {
        netTotalPaise -= net;
        refundCount++;
      }
    }

    const formattedNetTotal = CurrencyUtil.formatPaise(
      netTotalPaise,
      currency,
    );

    return {
      netTotal: formattedNetTotal,
      payinCount,
      refundCount,
      totalCount: rawTransactions.length,
      currency,
    };
  }, [rawTransactions]);

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 py-2 pb-14">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Transactions
            </h1>
            {rawTransactions.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-input">
                {rawTransactions.length}{" "}
                {rawTransactions.length === 1 ? "Record" : "Records"}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor real-time payments, settlements, and refunds across your merchant account.
          </p>
        </div>

        <Button
          text={isFetching ? "Refreshing..." : "Refresh"}
          color="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
          className="text-xs h-9 px-3.5 gap-1.5 self-start sm:self-auto"
        >
          <RotateCcw
            className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
          />
        </Button>
      </div>

      {/* ── Summary Metrics Cards (shown if we have data) ── */}
      {!isLoading && !isError && rawTransactions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Net Volume */}
          <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Net Settlement</span>
              <Wallet className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-mono">
              {metrics.netTotal}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Across all recorded transactions
            </span>
          </div>

          {/* Total Transactions */}
          <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Total Activity</span>
              <Filter className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground font-mono">
              {metrics.totalCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Settled payments & refunds
            </span>
          </div>

          {/* Pay-ins */}
          <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Pay-ins</span>
              <ArrowDownLeft className="w-4 h-4 text-success" />
            </div>
            <span className="text-xl font-bold tracking-tight text-success font-mono">
              {metrics.payinCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Successful customer charges
            </span>
          </div>

          {/* Refunds */}
          <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-4 flex flex-col gap-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Refunds</span>
              <ArrowUpRight className="w-4 h-4 text-warning" />
            </div>
            <span className="text-xl font-bold tracking-tight text-warning font-mono">
              {metrics.refundCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Reversals & chargebacks
            </span>
          </div>
        </div>
      )}

      {/* ── Filters & Search Bar (shown when there are transactions) ── */}
      {!isLoading && !isError && rawTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-3 rounded-[calc(var(--radius)+4px)]">
          {/* Type Filter Buttons */}
          <div className="flex items-center p-1 bg-muted/40 rounded-(--radius) border border-input self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType("ALL")}
              className={[
                "px-3 py-1 text-xs font-semibold rounded-(--radius-sm) transition-all cursor-pointer",
                filterType === "ALL"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              All ({rawTransactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("PAYIN")}
              className={[
                "px-3 py-1 text-xs font-semibold rounded-(--radius-sm) transition-all cursor-pointer",
                filterType === "PAYIN"
                  ? "bg-card text-success shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Payins ({metrics.payinCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("REFUND")}
              className={[
                "px-3 py-1 text-xs font-semibold rounded-(--radius-sm) transition-all cursor-pointer",
                filterType === "REFUND"
                  ? "bg-card text-warning shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              Refunds ({metrics.refundCount})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center min-w-56">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full text-xs bg-muted/30 border border-input rounded-(--radius) pl-8 pr-3 h-8 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
        </div>
      )}

      {/* ── Content States ── */}
      {isLoading ? (
        <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-16 flex flex-col items-center justify-center gap-3">
          <CircularLoadingBar size={38} strokeWidth={3.5} />
          <p className="text-xs text-muted-foreground">
            Loading merchant transactions...
          </p>
        </div>
      ) : isError ? (
        <div className="w-full bg-destructive/5 border border-destructive/20 rounded-[calc(var(--radius)+4px)] p-8 flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Failed to load transactions
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {error instanceof Error
                ? error.message
                : "Unable to retrieve transactions for the current merchant."}
            </p>
          </div>
          <Button
            text="Try Again"
            onClick={() => refetch()}
            color="secondary"
            className="mt-2 text-xs h-9 gap-1.5"
          />
        </div>
      ) : rawTransactions.length === 0 ? (
        <NoTransactionsComp />
      ) : filteredTransactions.length === 0 ? (
        <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-10 flex flex-col items-center justify-center text-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            No matching transactions
          </p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search query or filter.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredTransactions.map((tx: TransactionItem) => (
            <TransactionInfoComp
              key={tx.id}
              transaction={tx}
              onSelect={(selected) => setSelectedTransactionId(selected.id)}
            />
          ))}
        </div>
      )}

      {/* ── Transaction Details Dialog ── */}
      <TransactionDetailsDialog
        isOpen={Boolean(selectedTransactionId)}
        onClose={() => setSelectedTransactionId(null)}
        transactionId={selectedTransactionId}
      />
    </div>
  );
};

export default TransactionsPage;
