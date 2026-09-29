const TYPES = {
  // Payment Order types
  PaymentOrderMapper: Symbol.for("PaymentOrderMapper"),
  PaymentOrderRepository: Symbol.for("PaymentOrderRepository"),
  CreatePaymentOrderUsecase: Symbol.for("CreatePaymentOrderUsecase"),
  CheckoutPaymentOrderUsecase: Symbol.for("CheckoutPaymentOrderUsecase"),
  PaymentOrderController: Symbol.for("PaymentOrderController"),
  PaymentOrderRouter: Symbol.for("PaymentOrderRouter"),

  // Payment Method types
  PaymentMethodMapper: Symbol.for("PaymentMethodMapper"),
  PaymentMethodRepository: Symbol.for("PaymentMethodRepository"),

  // Payment Attempt types
  PaymentAttemptMapper: Symbol.for("PaymentAttemptMapper"),
  PaymentAttemptRepository: Symbol.for("PaymentAttemptRepository"),
  AttemptPaymentUsecase: Symbol.for("AttemptPaymentUsecase"),
  ProcessedPaymentAttemptUsecase: Symbol.for("ProcessedPaymentAttemptUsecase"),
  PaymentAttemptController: Symbol.for("PaymentAttemptController"),
  PaymentAttemptRouter: Symbol.for("PaymentAttemptRouter"),

  // Transaction types
  TransactionMapper: Symbol.for("TransactionMapper"),
  TransactionRepository: Symbol.for("TransactionRepository"),

  // Provider types
  PaymentProvider: Symbol.for("PaymentProvider"),
};

export default TYPES;
