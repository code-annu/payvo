import { validateRequest } from "@payvo/http/validation";
import { Router } from "express";
import { inject, injectable } from "inversify";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import ApiKeyController from "../controller/api-key.controller.js";
import { ApiKeyTypes } from "../api-key.types.js";
import * as schemas from "@payvo/shared/schema/requests";

@injectable()
export default class ApiKeyRouter {
  readonly router: Router;

  constructor(
    @inject(ApiKeyTypes.ApiKeyController)
    private readonly apiKeyController: ApiKeyController,
  ) {
    this.router = Router({ mergeParams: true });
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post(
      "/",
      authenticateUser,
      validateRequest(schemas.GenerateApiKeySchema),
      this.apiKeyController.postGenerateApiKey,
    );
    this.router.post(
      "/rotate",
      authenticateUser,
      validateRequest(schemas.RotateApiKeySchema),
      this.apiKeyController.rotateApiKey,
    );
    this.router.delete(
      "/:apiKeyId",
      authenticateUser,
      validateRequest(schemas.RevokeApiKeySchema),
      this.apiKeyController.revokeApiKey,
    );
    this.router.get(
      "/",
      authenticateUser,
      validateRequest(schemas.GetActiveApiKeySchema),
      this.apiKeyController.getActiveApiKey,
    );
    this.router.get(
      "/list",
      authenticateUser,
      validateRequest(schemas.ListMerchantApiKeysSchema),
      this.apiKeyController.getMerchantApiKeys,
    );
  }
}
