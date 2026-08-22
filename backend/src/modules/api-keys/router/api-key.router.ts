import { Router } from "express";
import { injectable, inject } from "inversify";
import TYPES from "@/core/di/inversify.types";
import ApiKeyController from "../api-key.controller";
import { validateRequest } from "@/shared/middleware/validate-request.middleware";
import { ApiKeyParamsSchema } from "../schema/ApiKeyParamsSchema";
import authenticateUser from "@/shared/middleware/authenticate.middleware";

@injectable()
export default class ApiKeyRouter {
  public readonly router: Router;

  constructor(
    @inject(TYPES.ApiKeyController)
    private readonly apiKeyController: ApiKeyController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/:id",
      authenticateUser,
      validateRequest(ApiKeyParamsSchema),
      this.apiKeyController.getApiKey,
    );

    this.router.patch(
      "/:id/revoke",
      authenticateUser,
      validateRequest(ApiKeyParamsSchema),
      this.apiKeyController.revokeApiKey,
    );

    this.router.delete(
      "/:id",
      authenticateUser,
      validateRequest(ApiKeyParamsSchema),
      this.apiKeyController.deleteApiKey,
    );
  }
}
