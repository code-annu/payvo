import { client } from "@payvo/database/client";

export function paymentOrderExpirationWorker() {
  let delay = 5_000;
  setInterval(async () => {
    try {
      const now = new Date();
      await client.orm.public.PaymentOrder.where((po) =>
        po.status.in(["CREATED", "PAYMENT_PENDING"]),
      )
        .where((po) => po.expiresAt.lt(now.toISOString()))
        .updateAndCount({ status: "EXPIRED" });
    } catch {
      console.error("error");
    }
  }, delay);
}
