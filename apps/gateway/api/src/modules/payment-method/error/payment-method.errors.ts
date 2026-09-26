import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import PaymentMethodErrorCode from "./PaymentMethodErrorCode.js";

export class PaymentMethodNotFoundError extends AppError {
  constructor(message: string = "Payment method not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: PaymentMethodErrorCode.PAYMENT_METHOD_NOT_FOUND,
    });
  }
}
