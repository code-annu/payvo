import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import ApiKeyController from "./api-key.controller.js";
import { CreateApiKeySchema } from "./schema/GenerateApiKeySchema.js";
import { GetActiveApiKeySchema } from "./schema/GetActiveApiKeySchema.js";
import { RotateMerchantApiKeySchema } from "./schema/RotateApiKeySchema.js";

@injectable()
export default class ApiKeyRouter {
  readonly router: Router;

  constructor(
    @inject(TYPES.ApiKeyController)
    private readonly controller: ApiKeyController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/merchants/:id/generate",
      authenticateUser,
      validateRequest(CreateApiKeySchema),
      this.controller.generateApiKey,
    );

    this.router.get(
      "/merchants/:id/active-key",
      authenticateUser,
      validateRequest(GetActiveApiKeySchema),
      this.controller.getActiveApiKey,
    );

    this.router.post(
      "/api-keys/:id/rotate",
      authenticateUser,
      validateRequest(RotateMerchantApiKeySchema),
      this.controller.rotateApiKey,
    );
  }
}
