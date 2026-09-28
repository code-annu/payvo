import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import PaymentAttemptErrorCode from "./PaymentAttemptErrorCode.js";
import { PaymentAttemptStatus } from "../entity/payment-attempt.entity.js";

export class PaymentAttemptNotFoundError extends AppError {
  constructor(message: string = "Payment attempt not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: PaymentAttemptErrorCode.PAYMENT_ATTEMPT_NOT_FOUND,
    });
  }
}

export class PaymentAttemptInvalidStateError extends AppError {
  constructor(
    message: string,
    details: {
      attemptStatus: PaymentAttemptStatus;
    },
  ) {
    super({
      message,
      statusCode: HttpStatusCode.Error.CONFLICT,
      code: PaymentAttemptErrorCode.PAYMENT_ATTEMPT_INVALID_STATE,
      details,
    });
  }
}
