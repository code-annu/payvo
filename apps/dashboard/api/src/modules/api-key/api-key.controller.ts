import TYPES from "@/core/di/inversify.types.js";
import { inject, injectable } from "inversify";
import ApiKeyService from "./api-key.service.js";
import catchAsync from "@/core/handlers/async.catch.js";
import { Response } from "express";
import { AuthRequest } from "@/core/middleware/authenticate.middleware.js";
import { StatusCode, buildSuccessResponse } from "@payvo/shared/http";

@injectable()
export default class ApiKeyController {
  constructor(
    @inject(TYPES.ApiKeyService) private readonly service: ApiKeyService,
  ) {}

  generateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    const { id: merchantId } = req.params as { id: string };
    const { environment } = req.body as { environment: "TEST" | "LIVE" };

    const result = await this.service.generateApiKey({
      userId: auth.sub,
      merchantId,
      environment,
    });

    res.status(StatusCode.Success.CREATED).json(
      buildSuccessResponse({
        keyId: result.apiKey.keyId,
        keySecret: result.keySecret,
        generatedOn: result.apiKey.createdAt,
      }),
    );
  });

  getMerchantActiveApiKey = catchAsync(
    async (req: AuthRequest, res: Response) => {
      const auth = req.auth!;
      const { id: merchantId } = req.params as { id: string };
      const { environment } = req.query as { environment: "TEST" | "LIVE" };

      const result = await this.service.getMerchantActiveApiKey({
        userId: auth.sub,
        merchantId,
        environment,
      });

      res.status(StatusCode.Success.OK).json(
        buildSuccessResponse({
          keyId: result.apiKey.keyId,
          generatedOn: result.apiKey.createdAt,
        }),
      );
    },
  );

  rotateApiKey = catchAsync(async (req: AuthRequest, res: Response) => {
    const auth = req.auth!;
    const { id: merchantId } = req.params as { id: string };
    const { environment, oldKeyRevokeStrategy } = req.body as {
      environment: "TEST" | "LIVE";
      oldKeyRevokeStrategy: "IMMEDIATELY" | "24_HOURS";
    };

    const result = await this.service.rotateApiKey({
      userId: auth.sub,
      merchantId,
      environment,
      oldKeyRevokeStrategy,
    });

    res.status(StatusCode.Success.OK).json(
      buildSuccessResponse({
        keyId: result.apiKey.keyId,
        keySecret: result.keySecret,
        generatedOn: result.apiKey.createdAt,
      }),
    );
  });
}
