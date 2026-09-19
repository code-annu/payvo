import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import { authenticateApiKey } from "@/core/middleware/authenticate-api-key.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import CheckoutSessionController from "./checkout-session.controller.js";
import { CreateCheckoutSessionSchema } from "./schema/CreateCheckoutSessionSchema.js";

@injectable()
export default class CheckoutSessionRouter {
  readonly router: Router;

  constructor(
    @inject(TYPES.CheckoutSessionController)
    private readonly controller: CheckoutSessionController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/",
      authenticateApiKey,
      validateRequest(CreateCheckoutSessionSchema),
      this.controller.postCreateCheckoutSession,
    );
  }
}
