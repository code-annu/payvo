import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import ApiKeyController from "./api-key.controller.js";
import { GenerateApiKeySchema } from "./schema/GenerateApiKeySchema.js";
import { GetActiveApiKeySchema } from "./schema/GetActiveApiKeySchema.js";
import { ListMerchantApiKeysSchema } from "./schema/ListMerchantApiKeysSchema.js";
import { RotateApiKeySchema } from "./schema/RotateApiKeySchema.js";
import { RevokeApiKeySchema } from "./schema/RevokeApiKeySchema.js";
import requireActiveUser from "@/core/middleware/require-active-user.middleware.js";

@injectable()
export default class ApiKeyRouter {
  readonly router: Router;
  private readonly authProtectionSuite = [authenticateUser, requireActiveUser];

  constructor(
    @inject(TYPES.ApiKeyController)
    private readonly apiKeyController: ApiKeyController,
  ) {
    this.router = Router({ mergeParams: true });
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/",
      this.authProtectionSuite,
      validateRequest(ListMerchantApiKeysSchema),
      this.apiKeyController.getMerchantApiKeys,
    );

    this.router.post(
      "/generate",
      this.authProtectionSuite,
      validateRequest(GenerateApiKeySchema),
      this.apiKeyController.postGenerateApiKey,
    );

    this.router.get(
      "/active",
      this.authProtectionSuite,
      validateRequest(GetActiveApiKeySchema),
      this.apiKeyController.getActiveApiKey,
    );

    this.router.post(
      "/rotate",
      this.authProtectionSuite,
      validateRequest(RotateApiKeySchema),
      this.apiKeyController.postRotateApiKey,
    );
    this.router.post(
      "/:apiKeyId/revoke",
      this.authProtectionSuite,
      validateRequest(RevokeApiKeySchema),
      this.apiKeyController.postRevokeApiKey,
    );
  }
}
