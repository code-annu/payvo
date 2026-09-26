import { Container } from "inversify";
import TYPES from "./inversify.types.js";

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

const container = new Container();

// Payment Order bindings
container.bind(TYPES.PaymentOrderMapper).to(PaymentOrderMapper);
container.bind(TYPES.PaymentOrderRepository).to(PaymentOrderRepository);
container.bind(TYPES.CreatePaymentOrderUsecase).to(CreatePaymentOrderUsecase);
container.bind(TYPES.CheckoutPaymentOrderUsecase).to(CheckoutPaymentOrderUsecase);
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

export default container;
