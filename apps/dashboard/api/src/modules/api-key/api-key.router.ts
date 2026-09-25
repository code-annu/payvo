import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import ApiKeyController from "./api-key.controller.js";
import { GenerateApiKeySchema } from "./schema/GenerateApiKeySchema.js";
import { GetActiveApiKeySchema } from "./schema/GetActiveApiKeySchema.js";
import { RotateApiKeySchema } from "./schema/RotateApiKeySchema.js";
import { RevokeApiKeySchema } from "./schema/RevokeApiKeySchema.js";
import requireActiveUser from "@/core/middleware/require-active-user.middleware.js";

@injectable()
export default class ApiKeyRouter {
  readonly router: Router;
  readonly merchantApiKeyRouter: Router;
  private readonly authProtectionSuite = [authenticateUser, requireActiveUser];

  constructor(
    @inject(TYPES.ApiKeyController)
    private readonly apiKeyController: ApiKeyController,
  ) {
    // main router
    this.router = Router();
    this.initRoutes();

    // merchant api key router
    this.merchantApiKeyRouter = Router({ mergeParams: true });
    this.initMerchantApiKeyRouter();
  }

  private initRoutes() {
    this.router.post(
      "/:apiKeyId/revoke",
      this.authProtectionSuite,
      validateRequest(RevokeApiKeySchema),
      this.apiKeyController.postRevokeApiKey,
    );
  }

  private initMerchantApiKeyRouter() {
    this.merchantApiKeyRouter.post(
      "/generate",
      this.authProtectionSuite,
      validateRequest(GenerateApiKeySchema),
      this.apiKeyController.postGenerateApiKey,
    );

    this.merchantApiKeyRouter.get(
      "/active",
      this.authProtectionSuite,
      validateRequest(GetActiveApiKeySchema),
      this.apiKeyController.getActiveApiKey,
    );

    this.merchantApiKeyRouter.post(
      "/rotate",
      this.authProtectionSuite,
      validateRequest(RotateApiKeySchema),
      this.apiKeyController.postRotateApiKey,
    );
  }
}
