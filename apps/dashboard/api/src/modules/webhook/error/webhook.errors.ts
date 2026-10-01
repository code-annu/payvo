import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import WebhookErrorCode from "./WebhookErrorCode.js";

export class WebhookNotFoundError extends AppError {
  constructor(message: string = "Webhook not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: WebhookErrorCode.WEBHOOK_NOT_FOUND,
    });
  }
}