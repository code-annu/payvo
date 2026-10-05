const TYPES = {
  // Auth types
  ApiKeyMapper: Symbol.for("ApiKeyMapper"),
  ApiKeyRepository: Symbol.for("ApiKeyRepository"),
  ValidateApiKeyUsecase: Symbol.for("ValidateApiKeyUsecase"),

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

  // Webhook types
  WebhookMapper: Symbol.for("WebhookMapper"),
  WebhookRepository: Symbol.for("WebhookRepository"),

  // Worker types
  WebhookWorker: Symbol.for("WebhookWorker"),
};

export default TYPES;
