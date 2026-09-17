import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import ApiKeyController from "./api-key.controller.js";
import { CreateApiKeySchema } from "./schema/GenerateApiKeySchema.js";
import { GetActiveApiKeySchema } from "./schema/GetActiveApiKeySchema.js";
import { RotateApiKeySchema } from "./schema/RotateApiKeySchema.js";
import requireActiveUser from "@/core/middleware/require-active-user.middleware.js";

@injectable()
export default class ApiKeyRouter {
  readonly router: Router;
  private readonly authProtectionSuite = [authenticateUser, requireActiveUser];

  constructor(
    @inject(TYPES.ApiKeyController)
    private readonly controller: ApiKeyController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/merchants/:id/api-keys/generate",
      this.authProtectionSuite,
      validateRequest(CreateApiKeySchema),
      this.controller.generateApiKey,
    );

    this.router.get(
      "/merchants/:id/api-keys/active-key",
      this.authProtectionSuite,
      validateRequest(GetActiveApiKeySchema),
      this.controller.getActiveApiKey,
    );

    this.router.post(
      "/merchants/:id/api-keys/rotate",
      this.authProtectionSuite,
      validateRequest(RotateApiKeySchema),
      this.controller.rotateApiKey,
    );
  }
}
