import { PaymentWebhookEvent } from "./webhook.events.js";

export interface WebhookPayload {
  event: PaymentWebhookEvent;
  data: {
    paymentOrderId: string;
    paymentAttemptId: string;
    amount: number;
    currency: string;
  };
}
