import TYPES from "@/core/di/inversify.types.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import ApiKeyController from "./api-key.controller.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import { GenerateApiKeySchema } from "./schema/GenerateApiKeySchema.js";
import { GetMerchantActiveApiKeySchema } from "./schema/GetMerchantActiveApiKeySchema.js";
import { RotateMerchantApiKeySchema } from "./schema/RotateMerchantApiKeySchema.js";

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
    // POST /api/merchants/:id/api-keys — generate a new API key
    this.router.post(
      "/:id/api-keys",
      authenticateUser,
      validateRequest(GenerateApiKeySchema),
      this.controller.generateApiKey,
    );

    // GET /api/merchants/:id/api-keys — get the active API key for an environment
    this.router.get(
      "/:id/api-keys",
      authenticateUser,
      validateRequest(GetMerchantActiveApiKeySchema),
      this.controller.getMerchantActiveApiKey,
    );

    // PATCH /api/merchants/:id/api-keys/rotate — rotate the active API key
    this.router.patch(
      "/:id/api-keys/rotate",
      authenticateUser,
      validateRequest(RotateMerchantApiKeySchema),
      this.controller.rotateApiKey,
    );
  }
}
