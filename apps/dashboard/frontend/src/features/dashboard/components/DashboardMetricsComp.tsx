import React from "react";
import {
  Wallet,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

export interface DashboardMetricsCompProps {
  netTotal: string;
  grossTotal: string;
  payinCount: number;
  refundCount: number;
}

export const DashboardMetricsComp: React.FC<DashboardMetricsCompProps> = ({
  netTotal,
  grossTotal,
  payinCount,
  refundCount,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Net Settlement */}
      <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-5 flex flex-col gap-2 shadow-2xs hover:border-primary/30 transition-all">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Net Settlement
          </span>
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
          {netTotal}
        </span>
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          Ready for payout & bank transfer
        </span>
      </div>

      {/* Gross Volume */}
      <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-5 flex flex-col gap-2 shadow-2xs hover:border-primary/30 transition-all">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Gross Volume
          </span>
          <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>
        <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
          {grossTotal}
        </span>
        <span className="text-xs text-muted-foreground">
          Total transaction turnover
        </span>
      </div>

      {/* Pay-ins */}
      <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-5 flex flex-col gap-2 shadow-2xs hover:border-success/30 transition-all">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Successful Pay-ins
          </span>
          <div className="w-8 h-8 rounded-full bg-success/15 text-success flex items-center justify-center">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>
        <span className="text-2xl font-bold font-mono tracking-tight text-success">
          {payinCount}
        </span>
        <span className="text-xs text-muted-foreground">
          Customer checkout charges completed
        </span>
      </div>

      {/* Refunds */}
      <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-5 flex flex-col gap-2 shadow-2xs hover:border-warning/30 transition-all">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-semibold uppercase tracking-wider">
            Refunds
          </span>
          <div className="w-8 h-8 rounded-full bg-warning/15 text-warning flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <span className="text-2xl font-bold font-mono tracking-tight text-warning">
          {refundCount}
        </span>
        <span className="text-xs text-muted-foreground">
          Reversals & refund transactions
        </span>
      </div>
    </div>
  );
};

export default DashboardMetricsComp;
