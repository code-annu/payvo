import React from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, ArrowRight } from "lucide-react";
import { Button } from "@/components/buttons/CustomButton";
import TransactionInfoComp from "@/features/transaction/components/TransactionInfoComp";
import AppRoutes from "@/router/app.routes";
import type { TransactionItem } from "@/features/transaction/api/transaction.types";

export interface RecentTransactionsCompProps {
  transactions: readonly TransactionItem[];
  isLoading: boolean;
  onSelectTransaction: (transactionId: string) => void;
}

export const RecentTransactionsComp: React.FC<
  RecentTransactionsCompProps
> = ({ transactions, isLoading, onSelectTransaction }) => {
  const navigate = useNavigate();
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Recent Transactions
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Latest payment settlements across your account.
          </p>
        </div>

        {transactions.length > 0 && (
          <button
            type="button"
            onClick={() => navigate(AppRoutes.TRANSACTIONS)}
            className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-12 flex flex-col items-center justify-center gap-2">
          <p className="text-xs text-muted-foreground">
            Loading recent transactions...
          </p>
        </div>
      ) : recentTransactions.length === 0 ? (
        <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-10 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              No transactions recorded yet
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              When your customers make payments using Payvo checkout, their
              settled transactions will appear right here.
            </p>
          </div>
          <Button
            text="Go to Transactions"
            color="secondary"
            onClick={() => navigate(AppRoutes.TRANSACTIONS)}
            className="text-xs h-8 px-3.5 mt-1"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recentTransactions.map((tx) => (
            <TransactionInfoComp
              key={tx.id}
              transaction={tx}
              onSelect={(selected) => onSelectTransaction(selected.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentTransactionsComp;
