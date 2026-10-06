import React from "react";
import { useNavigate } from "react-router-dom";
import { Terminal, ArrowRight, Sparkles } from "lucide-react";
import AppRoutes from "@/router/app.routes";

export const QuickstartApiComp: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate(AppRoutes.QUICKSTART_API);
  };

  return (
    <div
      onClick={handleNavigate}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNavigate();
        }
      }}
      className="group relative bg-card hover:bg-card/90 border border-border hover:border-primary/50 rounded-[calc(var(--radius)+4px)] p-6 flex flex-col justify-between gap-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer text-left"
    >
      <div className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-(--radius) bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                Quickstart API
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Payment Order API Sandbox
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground border border-input">
            POST /payment-orders/
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Create payment orders, generate instant customer checkout URLs, and
          test your integration with interactive code examples and dummy responses.
        </p>

        {/* Quick parameters pill list */}
        <div className="flex flex-col gap-1.5 p-3 rounded-(--radius) bg-muted/40 border border-border/60 text-xs">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Auth Headers:</span>
            <span className="font-mono text-foreground font-medium">
              x-api-key-id, x-api-key-secret
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Payload:</span>
            <span className="font-mono text-primary font-medium">
              amount, idempotencyKey
            </span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          Interactive Guide & Sandbox
        </span>

        <span className="text-xs font-semibold text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Open Guide <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </div>
  );
};

export default QuickstartApiComp;
