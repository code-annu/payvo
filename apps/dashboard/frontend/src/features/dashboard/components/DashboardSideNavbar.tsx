import { Home, ArrowLeftRight, KeyRound, Settings, Webhook } from "lucide-react";
import SideNavbarItem from "@/components/buttons/SideNavbarItem";
import AppRoutes from "@/router/app.routes";

/** The sidebar width constant, exported for the main content area offset */
export const SIDEBAR_WIDTH = "16rem";

export interface DashboardSideNavbarProps {
  /** Whether the mobile nav drawer is open */
  mobileNavOpen: boolean;
  /** Callback to close the mobile nav drawer */
  onCloseMobileNav: () => void;
}

/**
 * Fixed sidebar navigation.
 *
 * – On **lg+** screens it is always visible, pinned to the left.
 * – On smaller screens it slides in from the left as an overlay drawer,
 *   with a translucent backdrop that dismisses it on click.
 *
 * Uses the PayO sidebar design-system tokens defined in `theme.css`:
 *   `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, etc.
 */
export const DashboardSideNavbar: React.FC<DashboardSideNavbarProps> = ({
  mobileNavOpen,
  onCloseMobileNav,
}) => {
  return (
    <>
      {/* ── Mobile backdrop overlay ─────────────────────────── */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={onCloseMobileNav}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ───────────────────────────────────── */}
      <aside
        className={[
          // Positioning & sizing
          "fixed top-14 bottom-0 z-30",
          // Surface
          "bg-sidebar border-r border-sidebar-border",
          // Layout
          "flex flex-col justify-between",
          // Slide animation
          "transition-transform duration-300 ease-in-out",
          // Desktop: always visible; Mobile: slide in/out
          "lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{ width: SIDEBAR_WIDTH }}
        aria-label="Main navigation"
      >
        {/* ── Primary navigation ───────────────────────────── */}
        <nav className="flex-1 flex flex-col gap-1 p-3 pt-5 overflow-y-auto">
          <SideNavbarItem
            to={AppRoutes.HOME}
            icon={<Home className="w-5 h-5" />}
            label="Home"
          />
          <SideNavbarItem
            to={AppRoutes.TRANSACTIONS}
            icon={<ArrowLeftRight className="w-5 h-5" />}
            label="Transactions"
          />
          <SideNavbarItem
            to={AppRoutes.API_KEYS}
            icon={<KeyRound className="w-5 h-5" />}
            label="API Keys"
          />
          <SideNavbarItem
            to={AppRoutes.WEBHOOKS}
            icon={<Webhook className="w-5 h-5" />}
            label="Webhooks"
          />
        </nav>

        {/* ── Bottom section — Account & Settings ──────────── */}
        <div className="border-t border-sidebar-border p-3 pb-4">
          <SideNavbarItem
            to={AppRoutes.ACCOUNT_SETTINGS}
            icon={<Settings className="w-5 h-5" />}
            label="Account & Settings"
          />
        </div>
      </aside>
    </>
  );
};

export default DashboardSideNavbar;
