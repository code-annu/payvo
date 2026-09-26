import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { authenticateApiKey } from "@/core/middleware/authenticate-api-key.middleware.js";
import PaymentOrderController from "./payment-order.controller.js";
import { CreatePaymentOrderSchema } from "./schema/CreatePaymentOrderSchema.js";
import { CheckoutPaymentOrderSchema } from "./schema/CheckoutPaymentOrderSchema.js";

@injectable()
export default class PaymentOrderRouter {
  readonly router: Router;

  constructor(
    @inject(TYPES.PaymentOrderController)
    private readonly paymentOrderController: PaymentOrderController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      authenticateApiKey,
      validateRequest(CreatePaymentOrderSchema),
      this.paymentOrderController.createPaymentOrder,
    );

    this.router.get(
      "/:csi",
      validateRequest(CheckoutPaymentOrderSchema),
      this.paymentOrderController.checkoutPaymentOrder,
    );
  }
}
