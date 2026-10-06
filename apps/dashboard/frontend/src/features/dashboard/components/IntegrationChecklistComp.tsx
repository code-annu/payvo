import React from "react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

export interface ChecklistStep {
  title: string;
  description: string;
  completed: boolean;
  actionText: string;
  onAction: () => void;
}

export interface IntegrationChecklistCompProps {
  steps: ChecklistStep[];
}

export const IntegrationChecklistComp: React.FC<
  IntegrationChecklistCompProps
> = ({ steps }) => {
  const completedSteps = steps.filter((s) => s.completed).length;

  return (
    <div className="bg-card border border-border rounded-[calc(var(--radius)+4px)] p-6 flex flex-col gap-5 shadow-2xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground">
            Integration Checklist
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete these essentials to launch payments on your website or app.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary font-mono">
          {completedSteps} of {steps.length} Completed
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 rounded-full"
          style={{
            width: `${(completedSteps / steps.length) * 100}%`,
          }}
        />
      </div>

      {/* Step items */}
      <div className="flex flex-col divide-y divide-border/60">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5 shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-success" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/60" />
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span
                  className={`text-xs font-semibold ${
                    step.completed
                      ? "text-foreground line-through decoration-muted-foreground/50 opacity-80"
                      : "text-foreground"
                  }`}
                >
                  {step.title}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {step.description}
                </span>
              </div>
            </div>

            {!step.completed && (
              <button
                type="button"
                onClick={step.onAction}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <span>{step.actionText}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationChecklistComp;
