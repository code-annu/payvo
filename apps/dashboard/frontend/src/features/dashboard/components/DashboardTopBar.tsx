import type React from "react";
import { Menu, X } from "lucide-react";
import MerchantSwitcherIconButton from "@/features/merchant/components/MerchantSwitcherIconButton";
import PeekApiKeyIconButton from "@/features/api-key/components/PeekApiKeyIconButton";

export interface DashboardTopBarProps {
  /** Whether mobile nav is currently open */
  mobileNavOpen: boolean;
  /** Toggle mobile nav visibility */
  onToggleMobileNav: () => void;
}

/**
 * Fixed top bar with PayO branding on the left, and
 * API-key / merchant-switcher actions on the right.
 */
export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  mobileNavOpen,
  onToggleMobileNav,
}) => {
  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-40 h-14",
        "bg-card/80 backdrop-blur-md border-b border-border",
        "flex items-center justify-between px-4",
      ].join(" ")}
    >
      {/* ── Left: Mobile hamburger + Brand ────────────────── */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={onToggleMobileNav}
          aria-label="Toggle navigation"
          className={[
            "lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-(--radius)",
            "text-foreground hover:bg-muted transition-colors duration-150 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          ].join(" ")}
        >
          {mobileNavOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {/* Brand mark */}
        <div className="flex items-center gap-2 select-none">
          <div
            className={[
              "w-8 h-8 rounded-[calc(var(--radius)-2px)]",
              "bg-primary flex items-center justify-center",
              "text-primary-foreground font-bold text-sm",
              "shadow-sm shadow-primary/25",
            ].join(" ")}
          >
            P
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">
            Pay<span className="text-primary">O</span>
          </span>
        </div>
      </div>
      {/* ── Right: API Key + Merchant Switcher ────────────── */}
      <div className="flex items-center gap-2">
        {/* API Key eye button */}
        <PeekApiKeyIconButton />

        {/* Merchant switcher */}
        <MerchantSwitcherIconButton />
      </div>
    </header>
  );
};

export default DashboardTopBar;
