import { Container } from "inversify";
import TYPES from "./inversify.types.js";

// Auth module
import ApiKeyMapper from "@/modules/auth/api-key.mapper.js";
import ApiKeyRepository from "@/modules/auth/repository/api-key.repository.js";
import ValidateApiKeyUsecase from "@/modules/auth/application/usecase/ValidateApiKeyUsecase.js";

// Payment Order module
import PaymentOrderMapper from "@/modules/payment-order/payment-order.mapper.js";
import PaymentOrderRepository from "@/modules/payment-order/repository/payment-order.repository.js";
import CreatePaymentOrderUsecase from "@/modules/payment-order/application/usecase/CreatePaymentOrderUsecase.js";
import CheckoutPaymentOrderUsecase from "@/modules/payment-order/application/usecase/CheckoutPaymentOrderUsecase.js";
import PaymentOrderController from "@/modules/payment-order/payment-order.controller.js";
import PaymentOrderRouter from "@/modules/payment-order/payment-order.router.js";

// Payment Method module
import PaymentMethodMapper from "@/modules/payment-method/payment-method.mapper.js";
import PaymentMethodRepository from "@/modules/payment-method/repository/payment-method.repository.js";

// Payment Attempt module
import PaymentAttemptMapper from "@/modules/payment-attempt/payment-attempt.mapper.js";
import PaymentAttemptRepository from "@/modules/payment-attempt/repository/payment-attempt.repository.js";
import AttemptPaymentUsecase from "@/modules/payment-attempt/application/usecase/AttemptPaymentUsecase.js";
import PaymentAttemptController from "@/modules/payment-attempt/payment-attempt.controller.js";
import PaymentAttemptRouter from "@/modules/payment-attempt/payment-attempt.router.js";
import PaymentProvider from "@/provider/payment.provider.js";
import ProcessedPaymentAttemptUsecase from "@/modules/payment-attempt/application/usecase/ProcessedPaymentAttemptUsecase.js";

// Transaction module
import TransactionMapper from "@/modules/transaction/transaction.mapper.js";
import TransactionRepository from "@/modules/transaction/repository/transaction.repository.js";

// Webhook module
import WebhookMapper from "@/modules/webhook/webhook.mapper.js";
import WebhookRepository from "@/modules/webhook/repository/webhook.repository.js";

// Worker module
import WebhookWorker from "@/workers/webhook/webhook.worker.js";

const container = new Container();

// Auth bindings
container.bind(TYPES.ApiKeyMapper).to(ApiKeyMapper);
container.bind(TYPES.ApiKeyRepository).to(ApiKeyRepository);
container.bind(TYPES.ValidateApiKeyUsecase).to(ValidateApiKeyUsecase);

// Transaction bindings
container.bind(TYPES.TransactionMapper).to(TransactionMapper);
container.bind(TYPES.TransactionRepository).to(TransactionRepository);

// Payment Order bindings
container.bind(TYPES.PaymentOrderMapper).to(PaymentOrderMapper);
container.bind(TYPES.PaymentOrderRepository).to(PaymentOrderRepository);
container.bind(TYPES.CreatePaymentOrderUsecase).to(CreatePaymentOrderUsecase);
container
  .bind(TYPES.CheckoutPaymentOrderUsecase)
  .to(CheckoutPaymentOrderUsecase);
container.bind(TYPES.PaymentOrderController).to(PaymentOrderController);
container.bind(TYPES.PaymentOrderRouter).to(PaymentOrderRouter);

// Payment Method bindings
container.bind(TYPES.PaymentMethodMapper).to(PaymentMethodMapper);
container.bind(TYPES.PaymentMethodRepository).to(PaymentMethodRepository);

// Payment Attempt bindings
container.bind(TYPES.PaymentAttemptMapper).to(PaymentAttemptMapper);
container.bind(TYPES.PaymentAttemptRepository).to(PaymentAttemptRepository);
container.bind(TYPES.AttemptPaymentUsecase).to(AttemptPaymentUsecase);
container.bind(TYPES.PaymentAttemptController).to(PaymentAttemptController);
container.bind(TYPES.PaymentAttemptRouter).to(PaymentAttemptRouter);
container
  .bind(TYPES.ProcessedPaymentAttemptUsecase)
  .to(ProcessedPaymentAttemptUsecase);

// Provider bindings
container.bind(TYPES.PaymentProvider).to(PaymentProvider);

// Webhook bindings
container.bind(TYPES.WebhookMapper).to(WebhookMapper);
container.bind(TYPES.WebhookRepository).to(WebhookRepository);

// Worker bindings
container.bind(TYPES.WebhookWorker).to(WebhookWorker);

export default container;
