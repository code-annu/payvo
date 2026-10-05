import express, { type Express } from "express";
import container from "./core/di/inversify.config.js";
import TYPES from "./core/di/inversify.types.js";
import PaymentOrderRouter from "./modules/payment-order/payment-order.router.js";
import PaymentAttemptRouter from "./modules/payment-attempt/payment-attempt.router.js";
import handleError from "./core/middleware/error-handler.middleware.js";
import cors from "cors";
import { serverConfig } from "@payvo/config/server";

// Support JSON serialization of BigInt values
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

const app: Express = express();

const corsOptions = {
  origin: serverConfig.frontendUrl,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-gateway-secret",
    "x-frontend-secret",
  ],
  credentials: false, // if you're sending cookies or auth headers
};

app.use(express.json());
app.use(cors(corsOptions));

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
