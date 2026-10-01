import type React from "react";
import { Home, ArrowLeftRight, KeyRound, Settings } from "lucide-react";
import SideNavbarItem from "@/components/buttons/SideNavbarItem";
import AppRoutes from "@/router/app.routes";

const SIDEBAR_WIDTH = "16rem";

export interface DashboardSideNavbarProps {
  /** Whether the mobile nav is visible */
  mobileNavOpen: boolean;
  /** Close the mobile nav (e.g. on backdrop click) */
  onCloseMobileNav: () => void;
}

/**
 * Fixed sidebar with main nav items and Account & Settings at the bottom.
 * Responsive: slides in/out on mobile, always visible on lg+.
 */
export const DashboardSideNavbar: React.FC<DashboardSideNavbarProps> = ({
  mobileNavOpen,
  onCloseMobileNav,
}) => {
  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobileNav}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-14 bottom-0 z-30",
          "bg-sidebar border-r border-sidebar-border",
          "flex flex-col",
          "transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
        style={{ width: SIDEBAR_WIDTH }}
      >
        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-1 p-3 pt-4">
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
        </nav>

        {/* Bottom nav — Account & Settings */}
        <div className="border-t border-sidebar-border p-3">
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

/** The sidebar width constant, exported for the main content area offset */
export { SIDEBAR_WIDTH };

export default DashboardSideNavbar;
