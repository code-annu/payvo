import type React from "react";
import { useState } from "react";
import { UserCircle } from "lucide-react";
import MerchantSwitcherMenu from "./MerchantSwitcherMenu";

/**
 * Icon button that toggles the MerchantSwitcherMenu dropdown.
 * Self-contained — owns the open/close state for the menu.
 */
export const MerchantSwitcherIconButton: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        aria-label="Switch merchant"
        title="Switch merchant"
        className={[
          "inline-flex items-center justify-center w-9 h-9 rounded-full",
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 transition-all duration-200 cursor-pointer",
          "active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ].join(" ")}
      >
        <UserCircle className="w-5 h-5" />
      </button>

      <MerchantSwitcherMenu
        isOpen={isMenuOpen}
        onClose={closeMenu}
      />
    </div>
  );
};

export default MerchantSwitcherIconButton;
