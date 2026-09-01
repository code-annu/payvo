import TYPES from "@/core/di/inversify.types.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import MerchantController from "./merchant.controller.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { merchantIdParamsSchema } from "./schema/MerchantIdParamSchema.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";

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
    this.router.get("/", authenticateUser, this.controller.getUserMerchants);

    this.router.post("/", authenticateUser, this.controller.createMerchant);

    this.router.get(
      "/:id",
      authenticateUser,
      validateRequest({ params: merchantIdParamsSchema }),
      this.controller.getMerchantDetails,
    );

    this.router.patch(
      "/:id/activate",
      authenticateUser,
      validateRequest({ params: merchantIdParamsSchema }),
      this.controller.activateMerchant,
    );

    this.router.patch(
      "/:id/inactivate",
      authenticateUser,
      validateRequest({ params: merchantIdParamsSchema }),
      this.controller.inactivateMerchant,
    );

    this.router.delete(
      "/:id",
      authenticateUser,
      validateRequest({ params: merchantIdParamsSchema }),
      this.controller.deleteMerchant,
    );
  }
}
