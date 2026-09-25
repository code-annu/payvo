import ENV from "../env/load.js";

export const paymentConfig = {
  order: {
    expiryMinutes: Number(ENV.PAYMENT_ORDER_EXPIRY_MINUTES),
    checkoutBaseUrl: ENV.CHECKOUT_BASE_URL,
  },
};
