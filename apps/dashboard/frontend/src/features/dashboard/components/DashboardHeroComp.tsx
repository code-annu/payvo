import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, KeyRound, Webhook, ArrowRight } from "lucide-react";
import { Button } from "@/components/buttons/CustomButton";
import AppRoutes from "@/router/app.routes";

export interface DashboardHeroCompProps {
  userFullName?: string | null;
  companyName?: string | null;
  merchantMid?: string | null;
}

export const DashboardHeroComp: React.FC<DashboardHeroCompProps> = ({
  userFullName,
  companyName,
  merchantMid,
}) => {
  const navigate = useNavigate();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card via-card/90 to-primary/5 border border-border rounded-[calc(var(--radius)+6px)] p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Live Dashboard
          </span>
          {merchantMid && (
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground border border-input">
              MID: {merchantMid}
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {getGreeting()}, {userFullName || "Merchant"}
        </h1>
        <p className="text-sm text-muted-foreground max-w-xl">
          Here is your payment activity, settlement totals, and integration
          status for{" "}
          <span className="font-semibold text-foreground">
            {companyName || "your merchant account"}
          </span>
          .
        </p>
      </div>

      {/* Quick Nav Actions */}
      <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
        <Button
          text="API Keys"
          color="secondary"
          onClick={() => navigate(AppRoutes.API_KEYS)}
          className="text-xs h-9 px-3.5 gap-1.5"
        >
          <KeyRound className="w-3.5 h-3.5" />
        </Button>
        <Button
          text="Webhooks"
          color="secondary"
          onClick={() => navigate(AppRoutes.WEBHOOKS)}
          className="text-xs h-9 px-3.5 gap-1.5"
        >
          <Webhook className="w-3.5 h-3.5" />
        </Button>
        <Button
          text="Transactions"
          color="primary"
          onClick={() => navigate(AppRoutes.TRANSACTIONS)}
          className="text-xs h-9 px-3.5 gap-1.5"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
};

export default DashboardHeroComp;
