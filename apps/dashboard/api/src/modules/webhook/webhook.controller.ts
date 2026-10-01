import { buildSuccessResponse, HttpStatusCode } from "@payvo/shared/http";
import { inject, injectable } from "inversify";
import { Response } from "express";
import TYPES from "@/core/di/inversify.types.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import CreateWebhookUsecase from "./application/usecase/CreateWebhookUsecase.js";
import GetMerchantWebhooksUsecase from "./application/usecase/GetMerchantWebhooksUsecase.js";
import GetWebhookDetailsUsecase from "./application/usecase/GetWebhookDetailsUsecase.js";
import DeleteWebhookUsecase from "./application/usecase/DeleteWebhookUsecase.js";
import UpdateWebhookUsecase from "./application/usecase/UpdateWebhookUsecase.js";

@injectable()
export default class WebhookController {
  constructor(
    @inject(TYPES.CreateWebhookUsecase)
    private readonly createWebhookUsecase: CreateWebhookUsecase,
    @inject(TYPES.GetMerchantWebhooksUsecase)
    private readonly getMerchantWebhooksUsecase: GetMerchantWebhooksUsecase,
    @inject(TYPES.GetWebhookDetailsUsecase)
    private readonly getWebhookDetailsUsecase: GetWebhookDetailsUsecase,
    @inject(TYPES.DeleteWebhookUsecase)
    private readonly deleteWebhookUsecase: DeleteWebhookUsecase,
    @inject(TYPES.UpdateWebhookUsecase)
    private readonly updateWebhookUsecase: UpdateWebhookUsecase,
  ) {}

  postCreateWebhook = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.createWebhookUsecase.execute({
      merchantId: req.params.merchantId as string,
      url: req.body.url,
      userId: req.auth!.sub,
    });

    res
      .status(HttpStatusCode.Success.CREATED)
      .json(buildSuccessResponse(result));
  });

  getMerchantWebhooks = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.getMerchantWebhooksUsecase.execute({
      merchantId: req.params.merchantId as string,
      userId: req.auth!.sub,
    });

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(result));
  });

  getWebhookDetails = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.getWebhookDetailsUsecase.execute({
      webhookId: req.params.webhookId as string,
      userId: req.auth!.sub,
    });

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(result));
  });

  patchWebhook = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.updateWebhookUsecase.execute({
      webhookId: req.params.webhookId as string,
      url: req.body.url,
      userId: req.auth!.sub,
    });

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(result));
  });

  deleteWebhook = catchAsync(async (req: AuthRequest, res: Response) => {
    const result = await this.deleteWebhookUsecase.execute({
      webhookId: req.params.webhookId as string,
      userId: req.auth!.sub,
    });

    res.status(HttpStatusCode.Success.OK).json(buildSuccessResponse(result));
  });
}