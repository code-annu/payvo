import { Router } from "express";
import { inject, injectable } from "inversify";
import TYPES from "@/core/di/inversify.types.js";
import authenticateUser from "@/core/middleware/authenticate.middleware.js";
import requireActiveUser from "@/core/middleware/require-active-user.middleware.js";
import { validateRequest } from "@/core/middleware/validate-request.middleware.js";
import WebhookController from "./webhook.controller.js";
import { CreateWebhookSchema } from "./schema/CreateWebhookSchema.js";
import { GetMerchantWebhooksSchema } from "./schema/GetMerchantWebhooksSchema.js";
import { GetWebhookDetailsSchema } from "./schema/GetWebhookDetailsSchema.js";
import { DeleteWebhookSchema } from "./schema/DeleteWebhookSchema.js";
import { UpdateWebhookSchema } from "./schema/UpdateWebhookSchema.js";

@injectable()
export default class WebhookRouter {
  readonly router: Router;
  readonly merchantWebhookRouter: Router;
  private readonly authProtectionSuite = [authenticateUser, requireActiveUser];

  constructor(
    @inject(TYPES.WebhookController)
    private readonly webhookController: WebhookController,
  ) {
    this.router = Router();
    this.initRoutes();

    this.merchantWebhookRouter = Router({ mergeParams: true });
    this.initMerchantWebhookRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/:webhookId",
      this.authProtectionSuite,
      validateRequest(GetWebhookDetailsSchema),
      this.webhookController.getWebhookDetails,
    );

    this.router.patch(
      "/:webhookId",
      this.authProtectionSuite,
      validateRequest(UpdateWebhookSchema),
      this.webhookController.patchWebhook,
    );

    this.router.delete(
      "/:webhookId",
      this.authProtectionSuite,
      validateRequest(DeleteWebhookSchema),
      this.webhookController.deleteWebhook,
    );
  }

  private initMerchantWebhookRoutes() {
    this.merchantWebhookRouter.post(
      "/",
      this.authProtectionSuite,
      validateRequest(CreateWebhookSchema),
      this.webhookController.postCreateWebhook,
    );

    this.merchantWebhookRouter.get(
      "/",
      this.authProtectionSuite,
      validateRequest(GetMerchantWebhooksSchema),
      this.webhookController.getMerchantWebhooks,
    );
  }
}