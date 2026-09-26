import express, { type Express } from "express";
import container from "./core/di/inversify.config.js";
import TYPES from "./core/di/inversify.types.js";
import PaymentOrderRouter from "./modules/payment-order/payment-order.router.js";
import PaymentAttemptRouter from "./modules/payment-attempt/payment-attempt.router.js";
import handleError from "./core/middleware/error-handler.middleware.js";

const app: Express = express();

app.use(express.json());

// Payment Order routes
const paymentOrderRouter = container.get<PaymentOrderRouter>(
  TYPES.PaymentOrderRouter,
);
app.use("/api/payment-orders", paymentOrderRouter.router);

// Payment Attempt routes
const paymentAttemptRouter = container.get<PaymentAttemptRouter>(
  TYPES.PaymentAttemptRouter,
);
app.use(
  "/api/payment-orders/:paymentOrderId",
  paymentAttemptRouter.paymentOrderAttemptRouter,
);

app.use(handleError);

export default app;
