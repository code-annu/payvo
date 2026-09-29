import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import PaymentOrderErrorCode from "./PaymentOrderErrorCode.js";

export class PaymentOrderNotFoundError extends AppError {
  constructor(message: string = "Payment order not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: PaymentOrderErrorCode.PAYMENT_ORDER_NOT_FOUND,
    });
  }
}

export class PaymentOrderPaymentPendingError extends AppError {
  constructor(
    message: string = "Payment order already has a payment attempt in progress",
  ) {
    super({
      message,
      statusCode: HttpStatusCode.Error.BAD_REQUEST,
      code: PaymentOrderErrorCode.PAYMENT_ORDER_PAYMENT_PENDING,
    });
  }
}

export class PaymentOrderExpiredError extends AppError {
  constructor(message: string = "Payment order has expired") {
    super({
      message,
      statusCode: HttpStatusCode.Error.BAD_REQUEST,
      code: PaymentOrderErrorCode.PAYMENT_ORDER_EXPIRED,
    });
  }
}

export class PaymentOrderCompletedError extends AppError {
  constructor(message: string = "Payment order already completed") {
    super({
      message,
      statusCode: HttpStatusCode.Error.CONFLICT,
      code: PaymentOrderErrorCode.PAYMENT_ORDER_COMPLETED,
    });
  }
}
