import { Router } from "express";
import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types";
import ApiKeyController from "../api-key.controller";
import { validateRequest } from "@/shared/middleware/validate-request.middleware";
import { ApiKeyCreateSchema } from "../schema/ApiKeyCreateSchema";
import { MerchantApiKeyParamsSchema_ } from "../schema/ApiKeyParamsSchema";
import authenticateUser from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class BaseApiKeyRouter {
  public readonly router: Router;

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
      authenticateUser,
      validateRequest(MerchantApiKeyParamsSchema_),
      this.apiKeyController.getMerchantApiKeys,
    );

    this.router.post(
      "/",
      authenticateUser,
      validateRequest({ ...MerchantApiKeyParamsSchema_, ...ApiKeyCreateSchema }),
      this.apiKeyController.createApiKey,
    );
  }
}
