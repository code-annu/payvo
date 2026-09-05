import { UserCircle, Menu, X } from "lucide-react";
import ApiKeyIconButton from "@/features/api-keys/components/ApiKeyIconButtont";

export interface DashboardTopBarProps {
  /** Whether mobile nav is currently open */
  mobileNavOpen: boolean;
  /** Toggle mobile nav visibility */
  onToggleMobileNav: () => void;
  /** Open the merchant switcher dialog */
  onOpenSwitcher: () => void;
}

/**
 * Fixed top bar with PayO brand (left) and merchant switcher icon (right).
 */
export const DashboardTopBar: React.FC<DashboardTopBarProps> = ({
  mobileNavOpen,
  onToggleMobileNav,
  onOpenSwitcher,
}) => {
  return (
    <header
      className={[
        "fixed top-0 left-0 right-0 z-40 h-14",
        "bg-card/80 backdrop-blur-md border-b border-border",
        "flex items-center justify-between px-4",
      ].join(" ")}
    >
      {/* Left: Mobile hamburger + Brand */}
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
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

        {/* Brand logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[calc(var(--radius)-2px)] bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm shadow-primary/25">
            P
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">
            Pay<span className="text-primary">O</span>
          </span>
        </div>
      </div>

      {/* Right: API Key + Merchant switcher */}
      <div className="flex items-center gap-2">
        <ApiKeyIconButton />
        <button
          type="button"
          onClick={onOpenSwitcher}
          aria-label="Switch merchant"
          className={[
            "inline-flex items-center justify-center w-9 h-9 rounded-full",
            "bg-secondary text-secondary-foreground",
            "hover:bg-secondary/80 transition-all duration-200 cursor-pointer",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          ].join(" ")}
        >
          <UserCircle className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default DashboardTopBar;
