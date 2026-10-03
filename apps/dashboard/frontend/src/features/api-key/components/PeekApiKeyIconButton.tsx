import type React from "react";
import { useState } from "react";
import { Eye } from "lucide-react";
import PeekApiKeyDialog from "./PeekApiKeyDialog";

/**
 * Top bar icon button that toggles the PeekApiKeyDialog.
 * Self-contained — manages its own dialog visibility state.
 */
export const PeekApiKeyIconButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Peek API Key"
        title="Peek API Key"
        className={[
          "inline-flex items-center justify-center w-9 h-9 rounded-full",
          "bg-secondary text-secondary-foreground",
          "hover:bg-secondary/80 transition-all duration-200 cursor-pointer",
          "active:scale-95",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        ].join(" ")}
      >
        <Eye className="w-4.5 h-4.5" />
      </button>

      <PeekApiKeyDialog isOpen={isOpen} onClose={handleClose} />
    </>
  );
};

export default PeekApiKeyIconButton;
