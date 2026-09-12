import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import MerchantController from "./merchant.controller.js";
import { MerchantIdSchema } from "./schema/MerchantIdSchema.js";

@injectable()
export default class MerchantRouter {
  readonly router: Router;

  constructor(
    @inject(TYPES.MerchantController)
    private readonly controller: MerchantController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post("/", authenticateUser, this.controller.createMerchant);

    this.router.get("/", authenticateUser, this.controller.getUserMerchants);

    this.router.get(
      "/:id",
      authenticateUser,
      validateRequest({ params: MerchantIdSchema }),
      this.controller.getMerchant,
    );

    this.router.delete(
      "/:id",
      authenticateUser,
      validateRequest({ params: MerchantIdSchema }),
      this.controller.deleteMerchant,
    );
  }
}
