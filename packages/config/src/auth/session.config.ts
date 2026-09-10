import ENV from "../env/load";

export const sessionConfig = {
  sessionExpiryDays: Number(ENV.SESSION_EXPIRY_DAYS),
};
