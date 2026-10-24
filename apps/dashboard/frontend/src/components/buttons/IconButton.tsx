import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

type IconButtonProps = {
  icon: LucideIcon;
  label: string;
  to?: string;
  onClick?: () => void;
  className?: string;
};

const buttonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-full bg-secondary cursor-pointer text-secondary-foreground transition-colors hover:bg-primary/10 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2";

export default function IconButton({
  icon: Icon,
  label,
  to,
  onClick,
  className = "",
}: IconButtonProps) {
  const content = <Icon size={20} aria-hidden="true" />;

  if (to) {
    return (
      <Link
        to={to}
        className={`${buttonClassName} ${className}`}
        aria-label={label}
        title={label}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${buttonClassName} ${className}`}
      aria-label={label}
      title={label}
    >
      {content}
    </button>
  );
}
