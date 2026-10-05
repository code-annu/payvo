export default class DateTimeUtil {
  /**
   * Returns a human-readable remaining-time string from an ISO expiry date.
   * e.g. "Expired", "3m remaining", "1h 23m remaining"
   */
  static formatExpiry(isoDate: string | Date): string {
    const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
    const minutes = Math.max(0, Math.floor((d.getTime() - Date.now()) / 60000));
    if (minutes < 1) return "Expired";
    if (minutes < 60) return `${minutes}m remaining`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m remaining`;
  }

  /**
   * Returns true if the given ISO date / Date object is in the past.
   */
  static isExpired(isoDate: string | Date): boolean {
    const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
    return d.getTime() <= Date.now();
  }

  /**
   * Returns the remaining time in seconds (clamped to 0).
   */
  static getRemainingSeconds(isoDate: string | Date): number {
    const d = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
    return Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
  }

  /**
   * Formats remaining seconds into MM:SS or HH:MM:SS display.
   */
  static formatCountdown(totalSeconds: number): string {
    if (totalSeconds <= 0) return "00:00";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, "0");

    if (hours > 0) {
      return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${pad(minutes)}:${pad(seconds)}`;
  }
}
