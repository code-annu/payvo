/** Formats a date for display, optionally omitting the time. */
export function formatDateTime(date: Date, dateOnly = false): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(!dateOnly && {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  }).format(date);
}
