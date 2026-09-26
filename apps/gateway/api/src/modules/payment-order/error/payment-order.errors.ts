import { AppError } from "@payvo/shared/error";
import { HttpStatusCode } from "@payvo/shared/http";
import PaymentOrderErrorCode from "./PaymentOrderErrorCode.js";
import { PaymentOrderStatus } from "../entity/payment-order.entity.js";

export class PaymentOrderNotFoundError extends AppError {
  constructor(message: string = "Payment order not found") {
    super({
      message,
      statusCode: HttpStatusCode.Error.NOT_FOUND,
      code: PaymentOrderErrorCode.PAYMENT_ORDER_NOT_FOUND,
    });
  }
}

export class PaymentOrderInvalidState extends AppError {
  constructor(message: string, details: { orderStatus: PaymentOrderStatus }) {
    super({
      message,
      code: PaymentOrderErrorCode.PAYMENT_ORDER_INVALID_STATE,
      statusCode: HttpStatusCode.Error.CONFLICT,
      details,
    });
  }
}
