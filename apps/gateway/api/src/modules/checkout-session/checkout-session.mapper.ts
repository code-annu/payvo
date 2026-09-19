import { CheckoutSession as PrismaCheckoutSession } from "@payvo/database/types";
import { injectable } from "inversify";
import { CheckoutSession } from "./entity/checkout-session.entity.js";

@injectable()
export default class CheckoutSessionMapper {
  toCheckoutSessionEntity(
    session: PrismaCheckoutSession,
  ): CheckoutSession {
    return {
      id: session.id,
      csi: session.csi,
      status: session.status,
      paymentOrderId: session.paymentOrderId,
      expiresAt: new Date(session.expiresAt),
      createdAt: new Date(session.createdAt),
      updatedAt: new Date(session.updatedAt),
    };
  }
}
