import { Router } from "express";
import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types";
import MerchantController from "./merchant.controller";
import BaseApiKeyRouter from "@/modules/api-keys/router/base-api-key.router";
import { validateRequest } from "@/shared/middleware/validate-request.middleware";
import authenticateUser from "@/shared/middleware/authenticate.middleware";
import { MerchantIdParamsSchema } from "./schema/MerchantParamsSchema";

@injectable()
export default class MerchantRouter {
  public readonly router: Router;

  constructor(
    @inject(TYPES.MerchantController)
    private readonly merchantController: MerchantController,
    @inject(TYPES.BaseApiKeyRouter)
    private readonly baseApiKeyRouter: BaseApiKeyRouter,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.use("/:id/api-keys", this.baseApiKeyRouter.router);

    this.router.post(
      "/",
      authenticateUser,
      this.merchantController.createMerchant,
    );

    this.router.get(
      "/",
      authenticateUser,
      this.merchantController.getUserMerchants,
    );

    this.router.get(
      "/:id",
      authenticateUser,
      validateRequest(MerchantIdParamsSchema),
      this.merchantController.getMerchant,
    );

    this.router.delete(
      "/:id",
      authenticateUser,
      validateRequest(MerchantIdParamsSchema),
      this.merchantController.deleteMerchant,
    );
  }
}
