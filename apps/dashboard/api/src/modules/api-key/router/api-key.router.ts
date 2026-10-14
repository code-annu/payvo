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
  RotateApiKeySchema,
} from "../schema/api-key.schema.js";

@injectable()
export default class ApiKeyRouter {
  readonly router: Router;

  constructor(
    @inject(ApiKeyTypes.ApiKeyController)
    private readonly apiKeyController: ApiKeyController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes(): void {
    this.router.post(
      "/:merchantId/api-keys",
      authenticateUser,
      validateRequest(GenerateApiKeySchema),
      this.apiKeyController.postApiKey,
    );
    this.router.post(
      "/:merchantId/api-keys/rotate",
      authenticateUser,
      validateRequest(RotateApiKeySchema),
      this.apiKeyController.rotateApiKey,
    );
    this.router.get(
      "/:merchantId/api-keys",
      authenticateUser,
      validateRequest(GetActiveApiKeySchema),
      this.apiKeyController.getActiveApiKey,
    );
    this.router.get(
      "/:merchantId/api-keys/list",
      authenticateUser,
      validateRequest(ListMerchantApiKeysSchema),
      this.apiKeyController.getMerchantApiKeys,
    );
  }
}
