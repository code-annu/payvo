import TYPES from "@/core/di/inversify.types.js";
import authenticateInternal from "@/core/middleware/authenticate-internal.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import { Router } from "express";
import { inject, injectable } from "inversify";
import InternalController from "./internal.controller.js";
import { ValidateApiKeySchema } from "./schema/ValidateApiKeySchema.js";

@injectable()
export default class InternalRouter {
  readonly router: Router;

  constructor(
    @inject(TYPES.InternalController)
    private readonly controller: InternalController,
  ) {
    this.router = Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/validate-api-key",
      authenticateInternal,
      validateRequest(ValidateApiKeySchema),
      this.controller.validateApiKey,
    );
  }
}
