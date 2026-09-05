import type React from "react";
import { Check, Store } from "lucide-react";
import type { Merchant } from "../api/merchant.types";

export interface MerchantItemProps {
  /** The merchant data to display */
  merchant: Merchant;
  /** Display index (1-based) used as the merchant label */
  index: number;
  /** Whether this merchant is currently selected */
  isSelected: boolean;
  /** Callback when this merchant is clicked */
  onSelect: (merchantId: string) => void;
}

/**
 * A single merchant row inside a list.
 * Shows store icon, label, MID, active/inactive badge, and a check when selected.
 */
export const MerchantItem: React.FC<MerchantItemProps> = ({
  merchant,
  index,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(merchant.id)}
      className={[
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-(--radius)",
        "text-sm font-medium transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected
          ? "bg-primary/10 text-primary"
          : "text-popover-foreground hover:bg-muted",
      ].join(" ")}
    >
      <div
        className={[
          "shrink-0 w-8 h-8 rounded-(--radius) flex items-center justify-center",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        ].join(" ")}
      >
        <Store className="w-4 h-4" />
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="truncate font-medium">Merchant {index}</p>
        <p className="text-xs text-muted-foreground truncate font-mono">
          {merchant.mid}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={[
            "inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase tracking-wide",
            merchant.isActive
              ? "bg-success/15 text-success"
              : "bg-muted text-muted-foreground",
          ].join(" ")}
        >
          {merchant.isActive ? "Active" : "Inactive"}
        </span>
        {isSelected && (
          <Check className="w-4 h-4 text-primary shrink-0" />
        )}
      </div>
    </button>
  );
};

export default MerchantItem;
