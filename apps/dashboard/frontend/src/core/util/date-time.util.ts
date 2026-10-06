export default abstract class DateTimeUtil {
  static formatDate(dateInput?: string | Date | null): string {
    if (!dateInput) return "—";
    try {
      const date =
        typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return String(dateInput);
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateInput);
    }
  }

  static formatDateShort(dateInput?: string | Date | null): string {
    if (!dateInput) return "—";
    try {
      const date =
        typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return String(dateInput);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return String(dateInput);
    }
  }

  static formatDateTime(dateInput?: string | Date | null): string {
    if (!dateInput) return "—";
    try {
      const date =
        typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      if (isNaN(date.getTime())) return String(dateInput);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return String(dateInput);
    }
  }
}
