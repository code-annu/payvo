export default class AmountUtil {
  /**
   * Format an amount (in smallest currency unit, e.g. paisa) to a human-readable
   * currency string using the Indian locale.
   */
  static formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  }
}
