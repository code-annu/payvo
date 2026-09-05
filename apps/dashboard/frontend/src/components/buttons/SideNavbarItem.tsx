import type React from "react";
import { NavLink } from "react-router-dom";

export interface SideNavbarItemProps {
  /** Route path to navigate to */
  to: string;
  /** Lucide icon component */
  icon: React.ReactNode;
  /** Display label */
  label: string;
}

/**
 * Sidebar navigation item with active-state highlighting.
 * Uses PayO sidebar design tokens for consistent theming.
 */
export const SideNavbarItem: React.FC<SideNavbarItemProps> = ({
  to,
  icon,
  label,
}) => {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 px-3 py-2.5 rounded-(--radius)",
          "text-sm font-medium transition-all duration-200 ease-in-out select-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        ].join(" ")
      }
    >
      <span className="shrink-0 w-5 h-5 transition-colors duration-200">
        {icon}
      </span>
      <span className="truncate">{label}</span>
    </NavLink>
  );
};

export default SideNavbarItem;
