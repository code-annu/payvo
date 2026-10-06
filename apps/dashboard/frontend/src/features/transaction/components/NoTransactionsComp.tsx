import React from "react";
import { ArrowLeftRight } from "lucide-react";

export const NoTransactionsComp: React.FC = () => {
  return (
    <div className="w-full bg-card border border-border rounded-[calc(var(--radius)+4px)] p-12 flex flex-col items-center justify-center text-center gap-4">
      <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center shadow-xs">
        <ArrowLeftRight className="w-7 h-7" />
      </div>
      <div className="max-w-md">
        <h3 className="text-base font-bold text-foreground">
          No transactions yet
        </h3>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          When orders are paid or refunded for this merchant, transactions will automatically appear here with settlement figures and payment details.
        </p>
      </div>
    </div>
  );
};

export default NoTransactionsComp;
