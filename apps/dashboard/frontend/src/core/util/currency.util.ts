export default abstract class CurrencyUtil {
  /**
   * Converts an amount in paise to Indian Rupees (INR) and formats as currency (₹X.XX).
   * @param amountInPaise The amount in paise (e.g. 10000 paise = ₹100.00)
   * @param currency The ISO currency code (defaults to "INR")
   */
  static formatPaise(
    amountInPaise?: string | number | null,
    currency: string = "INR",
  ): string {
    if (
      amountInPaise === undefined ||
      amountInPaise === null ||
      amountInPaise === ""
    ) {
      return "—";
    }

    const paise = Number(amountInPaise);
    if (isNaN(paise)) return `${currency} ${amountInPaise}`;

    const rupees = paise / 100;

    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency || "INR",
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      }).format(rupees);
    } catch {
      return `₹${rupees.toFixed(2)}`;
    }
  }

  /**
   * Converts paise to rupees as a number.
   * @param amountInPaise The amount in paise
   */
  static paiseToRupees(amountInPaise?: string | number | null): number {
    if (!amountInPaise) return 0;
    const num = Number(amountInPaise);
    return isNaN(num) ? 0 : num / 100;
  }
}
