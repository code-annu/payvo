import { validateRequest } from "@payvo/http/validation";
import { Router } from "express";
import { inject, injectable } from "inversify";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import ApiKeyController from "../controller/api-key.controller.js";
import { ApiKeyTypes } from "../api-key.types.js";
import {
  GenerateApiKeySchema,
  GetActiveApiKeySchema,
  ListMerchantApiKeysSchema,
  RevokeApiKeySchema,
  RotateApiKeySchema,
} from "../schema/api-key.schema.js";

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
      validateRequest(GenerateApiKeySchema),
      this.apiKeyController.postApiKey,
    );
    this.router.post(
      "/rotate",
      authenticateUser,
      validateRequest(RotateApiKeySchema),
      this.apiKeyController.rotateApiKey,
    );
    this.router.delete(
      "/:apiKeyId",
      authenticateUser,
      validateRequest(RevokeApiKeySchema),
      this.apiKeyController.revokeApiKey,
    );
    this.router.get(
      "/",
      authenticateUser,
      validateRequest(GetActiveApiKeySchema),
      this.apiKeyController.getActiveApiKey,
    );
    this.router.get(
      "/list",
      authenticateUser,
      validateRequest(ListMerchantApiKeysSchema),
      this.apiKeyController.getMerchantApiKeys,
    );
  }
}
